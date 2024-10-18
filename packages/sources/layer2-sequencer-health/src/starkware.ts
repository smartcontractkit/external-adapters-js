import { Logger } from '@chainlink/ea-bootstrap'
import { DEFAULT_PRIVATE_KEY, ExtendedConfig, Networks } from './config'
import { ec, Account, InvokeFunctionResponse, BlockWithTxHashes } from 'starknet'
import { race, retry } from './network'

interface StarkwareState {
  lastBlockResponse: BlockWithTxHashes | null
  lastUpdated: number
  isSequencerHealthy: boolean
}

export const sendDummyStarkwareTransaction = async (config: ExtendedConfig): Promise<void> => {
  const starkKeyPub = ec.starkCurve.getStarkKey(DEFAULT_PRIVATE_KEY)
  const provider = config.starkwareConfig.provider
  const account = new Account(
    provider,
    config.starkwareConfig.dummyAccountAddress,
    DEFAULT_PRIVATE_KEY,
  )

  // We send an empty transaction to Starknet and see if we get back an expected error.
  await race<InvokeFunctionResponse>({
    timeout: config.timeoutLimit,
    promise: account.execute(
      {
        contractAddress: config.starkwareConfig.dummyAccountAddress,
        entrypoint: 'initialize',
        calldata: [starkKeyPub, '0'],
      },
      undefined,
      { maxFee: '0' },
    ),
    error: `Transaction receipt not received in ${config.timeoutLimit} milliseconds`,
  })
}

/**
 * The centralized Starkware sequencer is made up of two internal components.  The first is the gateway which is used to query the Sequencer state
 * and the batcher which adds transactions to the pending block and processes the pending block to add it into the L2 chain.  The
 * Sequencer is considered unhealthy if either of the components are down.
 *
 *  - The gateway is considered to be down if request to fetch pending block times out or if we get a 404
 *  - The batcher is considered to be down if we a new block has not been produced AND no new transactions have been added to the
 *  pending block within a given time interval.
 * status when fetching
 * @param networks
 * @returns true if Sequencer is healthy
 */
export const checkStarkwareSequencerPendingTransactions = (): ((
  config: ExtendedConfig,
) => Promise<boolean>) => {
  let state: StarkwareState = {
    lastUpdated: 0,
    isSequencerHealthy: true,
    lastBlockResponse: null,
  }
  return async (config: ExtendedConfig): Promise<boolean> => {
    const delta = config.deltaChain[Networks.Starkware]
    const currentTime = Date.now()
    if (state.lastUpdated > 0 && currentTime - state.lastUpdated < delta) {
      Logger.debug(
        `[starkware] Skipping check for Starkware Sequencer health as it has been less than ${delta} seconds since last check`,
      )
      return state.isSequencerHealthy
    }
    const { pendingBlockResponse } = await getPendingBlockFromGateway(config)
    if (!pendingBlockResponse) {
      state.isSequencerHealthy = false
      state.lastUpdated = currentTime
      return false
    }

    const isBatcherHealthy = checkBatcherHealthy(state.lastBlockResponse, pendingBlockResponse)
    state = {
      lastBlockResponse: pendingBlockResponse,
      lastUpdated: currentTime,
      isSequencerHealthy: isBatcherHealthy,
    }
    return isBatcherHealthy
  }
}

const getPendingBlockFromGateway = async (
  config: ExtendedConfig,
): Promise<{
  pendingBlockResponse: BlockWithTxHashes | null
}> => {
  let pendingBlockResponse = null
  try {
    pendingBlockResponse = await retry<BlockWithTxHashes>({
      promise: async () => config.starkwareConfig.provider.getBlockWithTxHashes('pending'),
      retryConfig: config.retryConfig,
    })
  } catch (e: any) {
    if (e.providerStatusCode === 504) {
      Logger.warn(
        `[starkware] Request to fetch pending block timed out.  Status Code: ${e.providerStatusCode}.  Sequencer: UNHEALTHY`,
      )
    } else {
      throw e
    }
  }
  return {
    pendingBlockResponse,
  }
}

const checkBatcherHealthy = (
  previousBlock: BlockWithTxHashes | null,
  currentBlock: BlockWithTxHashes,
): boolean => {
  if (!previousBlock) {
    return currentBlock.transactions.length > 0
  }
  if (previousBlock.parent_hash !== currentBlock.parent_hash) {
    Logger.info(
      `[starkware] New pending Starkware block found with parent hash ${currentBlock.parent_hash}.  Sequencer: HEALTHY`,
    )
    return true
  }
  Logger.info(
    `[starkware] Pending Starkware block still has parent hash of ${currentBlock.parent_hash}.  Checking to see if it is still processing transactions...`,
  )
  const hasNewTxns =
    Object.keys(currentBlock.transactions).length > previousBlock.transactions.length
  if (hasNewTxns) {
    Logger.info(`[starkware] Found new transactions in pending block.  Sequencer: HEALTHY`)
  } else {
    Logger.info(`[starkware] Did not find new transactions in pending block.  Sequencer: UNHEALTHY`)
  }
  return hasNewTxns
}
