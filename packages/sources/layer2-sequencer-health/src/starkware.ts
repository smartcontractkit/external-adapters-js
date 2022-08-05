import { Logger } from '@chainlink/ea-bootstrap'
import { DEFAULT_PRIVATE_KEY, ExtendedConfig, Networks } from './config'
import { ec, Account, InvokeFunctionResponse, GetBlockResponse } from 'starknet'
import { race } from './network'

interface StarwareState {
  parentBlockHash: string
  txnCount: number
  lastUpdated: number
  isSequencerHealthy: boolean
}

export const sendDummyStarkwareTransaction = async (config: ExtendedConfig): Promise<boolean> => {
  const starkKeyPair = ec.genKeyPair(DEFAULT_PRIVATE_KEY)
  const starkKeyPub = ec.getStarkKey(starkKeyPair)
  const provider = config.starkwareConfig.provider
  const account = new Account(provider, config.starkwareConfig.argentAccountAddr, starkKeyPair)

  const receipt = await race<InvokeFunctionResponse>({
    timeout: config.timeoutLimit,
    promise: account.execute(
      {
        contractAddress: config.starkwareConfig.argentAccountAddr,
        entrypoint: 'initialize',
        calldata: [starkKeyPub, '0'],
      },
      undefined,
      { maxFee: '0' },
    ),
    error: `Transaction receipt not received in ${config.timeoutLimit} milliseconds`,
  })
  Logger.info(
    `Transaction receipt received with hash ${receipt.transaction_hash} for network: ${Networks.Starkware}`,
  )

  return true
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
  let recordedStarkwareState: StarwareState = {
    parentBlockHash: '',
    txnCount: 0,
    lastUpdated: 0,
    isSequencerHealthy: true,
  }
  return async (config: ExtendedConfig): Promise<boolean> => {
    const delta = config.delta
    const currentTime = Date.now()
    if (
      recordedStarkwareState.lastUpdated > 0 &&
      currentTime - recordedStarkwareState.lastUpdated < delta
    ) {
      Logger.debug(
        `Skipping check for Starkware Sequencer health as it has been less than ${delta} seconds since last check`,
      )
      return recordedStarkwareState.isSequencerHealthy
    }
    const { hasErrored, pendingBlockParams } = await getPendingBlockFromGateway(config)
    if (hasErrored) {
      recordedStarkwareState.isSequencerHealthy = false
      recordedStarkwareState.lastUpdated = currentTime
      return false
    }
    const isBatcherHealthy = checkBatcherHealthy(recordedStarkwareState, pendingBlockParams)
    recordedStarkwareState = {
      parentBlockHash: pendingBlockParams.parent_hash,
      txnCount: Object.keys(pendingBlockParams.transactions).length,
      lastUpdated: currentTime,
      isSequencerHealthy: isBatcherHealthy,
    }
    return isBatcherHealthy
  }
}

const getPendingBlockFromGateway = async (
  config: ExtendedConfig,
): Promise<{
  hasErrored?: boolean
  pendingBlockParams: GetBlockResponse
}> => {
  let pendingBlockParams: GetBlockResponse
  let hasErrored = false
  try {
    pendingBlockParams = await config.starkwareConfig.provider.getBlock('pending')
  } catch (e: any) {
    if (e.providerStatusCode === 504) {
      Logger.warn(
        `Request to fetch pending block timed out.  Status Code: ${e.providerStatusCode}.  Sequencer: UNHEALTHY`,
      )
      hasErrored = true
    }
    throw e
  }
  return {
    hasErrored,
    pendingBlockParams,
  }
}

const checkBatcherHealthy = (
  recordedStarkwareState: StarwareState,
  pendingBlockParams: GetBlockResponse,
): boolean => {
  if (recordedStarkwareState.parentBlockHash !== pendingBlockParams.parent_hash) {
    Logger.info(
      `New pending Starkware block found with parent hash ${pendingBlockParams.parent_hash}.  Sequencer: HEALTHY`,
    )
    return true
  }
  Logger.info(
    `Pending Starkware block still has parent hash of ${pendingBlockParams.parent_hash}.  Checking to see if it is still processing transactions...`,
  )
  const hasNewTxns =
    Object.keys(pendingBlockParams.transactions).length > recordedStarkwareState.txnCount
  if (hasNewTxns) {
    Logger.info(`Found new transactions in pending block.  Sequencer: HEALTHY`)
  } else {
    Logger.info(`Did not find new transactions in pending block.  Sequencer: UNHEALTHY`)
  }
  return hasNewTxns
}
