import { Logger, Requester } from '@chainlink/ea-bootstrap'
import { DEFAULT_PRIVATE_KEY, ExtendedConfig, Networks } from './config'
import { ec, Account, AddTransactionResponse, Provider, ProviderInterface } from 'starknet'
import { race } from './network'

export interface StarkwareBlockResponse {
  parent_block_hash: string
  status: string
  gas_price: string
  transactions: {
    contract_address: string
    entry_point_selector: string
    entry_point_type: string
    calldata: string[]
  }[]
}

interface PendingBlockState {
  parentBlockHash: string
  txnCount: number
  lastUpdated: number
  lastStatus: boolean
}

export const sendDummyStarkwareTransaction = async (config: ExtendedConfig): Promise<boolean> => {
  const starkKeyPair = ec.genKeyPair(DEFAULT_PRIVATE_KEY)
  const starkKeyPub = ec.getStarkKey(starkKeyPair)

  ProviderInterface

  const provider = new Provider({
    baseUrl: config.starkwareConfig.sequencerUrl,
    feederGatewayUrl: config.starkwareConfig.feederGatewayUrl,
    gatewayUrl: config.starkwareConfig.gatewayUrl,
  })

  const account = new Account(provider, config.starkwareConfig.argentAccountAddr, starkKeyPair)

  const receipt = await race<AddTransactionResponse>({
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
    `Transaction receipt received with hash ${receipt.transaction_hash} for EVM network: ${Networks.Starkware}`,
  )
  await provider.waitForTransaction(receipt.transaction_hash)
  const tx = await provider.getTransaction(receipt.transaction_hash)
  return tx.status !== 'REJECTED'
}

/**
 * The Starkware sequencer is made up of two internal components.  The first is the gateway which is used to query the Sequencer state
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
  let lastSeenPendingBlock: PendingBlockState = {
    parentBlockHash: '',
    txnCount: 0,
    lastUpdated: 0,
    lastStatus: true,
  }
  return async (config: ExtendedConfig): Promise<boolean> => {
    const delta = config.delta
    const currentTime = Date.now()
    if (
      lastSeenPendingBlock.lastUpdated > 0 &&
      currentTime - lastSeenPendingBlock.lastUpdated < delta
    ) {
      Logger.debug(
        `Skipping check for Starkware Sequencer health as it has been less than ${delta} seconds since last check`,
      )
      return lastSeenPendingBlock.lastStatus
    }
    let pendingBlockParams: StarkwareBlockResponse
    try {
      const { data } = await Requester.request<StarkwareBlockResponse>({
        url: `${config.starkwareConfig.sequencerUrl}/${config.starkwareConfig.feederGatewayUrl}/get_block?blockNumber=pending`,
      })
      pendingBlockParams = data
    } catch (e: any) {
      if (e.providerStatusCode === 504) {
        Logger.warn(
          `Request to fetch pending block timed out.  Status Code: ${e.providerStatusCode}.  Sequencer: UNHEALTHY`,
        )
        lastSeenPendingBlock.lastStatus = false
        return false
      }
      throw e
    }
    const isBatcherHealthy = checkBatcherHealthy(lastSeenPendingBlock, pendingBlockParams)
    lastSeenPendingBlock = {
      parentBlockHash: pendingBlockParams.parent_block_hash,
      txnCount: pendingBlockParams.transactions.length,
      lastUpdated: currentTime,
      lastStatus: isBatcherHealthy,
    }
    return isBatcherHealthy
  }
}

const checkBatcherHealthy = (
  lastSeenPendingBlock: PendingBlockState,
  pendingBlockParams: StarkwareBlockResponse,
): boolean => {
  if (lastSeenPendingBlock.parentBlockHash !== pendingBlockParams.parent_block_hash) {
    Logger.info(
      `New pending Starkware block found with parent hash ${pendingBlockParams.parent_block_hash}.  Sequencer: HEALTHY`,
    )
    return true
  }
  Logger.info(
    `Pending Starkware block still has parent hash of ${pendingBlockParams.parent_block_hash}.  Checking to see if it is still processing transactions...`,
  )
  const hasNewTxns = pendingBlockParams.transactions.length > lastSeenPendingBlock.txnCount
  if (hasNewTxns) {
    Logger.info(`Found new transactions in pending block.  Sequencer: HEALTHY`)
  } else {
    Logger.info(`Did not find new transactions in pending block.  Sequencer: UNHEALTHY`)
  }
  return hasNewTxns
}
