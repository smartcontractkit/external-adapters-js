import {
  AdapterResponseEmptyError,
  AdapterResponseInvalidError,
  AxiosRequestConfig,
  Logger,
  Requester,
} from '@chainlink/ea-bootstrap'
import { BigNumber, ethers } from 'ethers'
import {
  CHAIN_IDS,
  DEFAULT_PRIVATE_KEY,
  EVMNetworks,
  ExtendedConfig,
  Networks,
  RPC_ENDPOINTS,
} from './config'
import { race, ResponseSchema, retry } from './network'

export const sendEVMDummyTransaction = async (
  network: EVMNetworks,
  timeout: number,
): Promise<void> => {
  const rpcEndpoint = RPC_ENDPOINTS[network]
  const chainId = CHAIN_IDS[network]
  const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint, chainId)
  const wallet = new ethers.Wallet(DEFAULT_PRIVATE_KEY, provider)

  const networkTx: Record<EVMNetworks, ethers.providers.TransactionRequest> = {
    // Arbitrum zero gas price will be auto adjusted by the network to the minimum
    [Networks.Arbitrum]: {
      value: 0,
      gasLimit: 0,
      gasPrice: 1,
      to: wallet.address,
    },
    [Networks.Optimism]: {
      value: 0,
      gasLimit: 0,
      gasPrice: 0,
      to: wallet.address,
    },
    [Networks.Metis]: {
      value: 0,
      gasLimit: 0,
      gasPrice: 0,
      to: wallet.address,
    },
  }
  await race<ethers.providers.TransactionResponse>({
    timeout,
    promise: wallet.sendTransaction(networkTx[network]),
    error: `Transaction receipt not received in ${timeout} milliseconds`,
  })
}

export const checkOptimisticRollupBlockHeight = (
  network: EVMNetworks,
): ((config: ExtendedConfig) => Promise<boolean>) => {
  let lastSeenBlock: { block: number; timestamp: number } = {
    block: 0,
    timestamp: 0,
  }

  const _isPastBlock = (block: number) => block <= lastSeenBlock.block
  const _isStaleBlock = (block: number, delta: number): boolean => {
    return _isPastBlock(block) && Date.now() - lastSeenBlock.timestamp >= delta
  }
  // If the request hit a replica node that fell behind, the block could be previous to the last seen. Including a deltaBlocks range to consider this case.
  const _isValidBlock = (block: number, deltaBlocks: number) =>
    lastSeenBlock.block - block <= deltaBlocks
  const _updateLastSeenBlock = (block: number): void => {
    lastSeenBlock = {
      block,
      timestamp: Date.now(),
    }
  }

  return async (config: ExtendedConfig): Promise<boolean> => {
    const { delta, deltaBlocks, retryConfig } = config
    const block = await retry<number>({
      promise: async () => await requestBlockHeight(network),
      retryConfig,
    })
    if (!_isValidBlock(block, deltaBlocks))
      throw new AdapterResponseInvalidError({
        message: `Block found #${block} is previous to last seen #${lastSeenBlock.block} with more than ${deltaBlocks} difference`,
      })
    if (!_isStaleBlock(block, delta)) {
      if (!_isPastBlock(block)) _updateLastSeenBlock(block)
      Logger.info(
        `Block #${block} is not considered stale at ${Date.now()}. Last seen block #${
          lastSeenBlock.block
        } was at ${lastSeenBlock.timestamp}`,
      )
      return true
    }
    Logger.warn(
      `Block #${block} is considered stale at ${Date.now()}. Last seen block #${
        lastSeenBlock.block
      } was at ${lastSeenBlock.timestamp}, more than ${delta} milliseconds ago.`,
    )
    return false
  }
}

export const requestBlockHeight = async (network: EVMNetworks): Promise<number> => {
  const request: AxiosRequestConfig = {
    method: 'POST',
    url: RPC_ENDPOINTS[network],
    headers: {
      'Content-Type': 'application/json',
    },
    data: {
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      params: [],
      id: 1,
    },
  }
  const response = await Requester.request<ResponseSchema>(request)
  const hexBlock = response.data.result
  if (!hexBlock) {
    throw new AdapterResponseEmptyError({
      message: `Block number not found on network: ${network}`,
    })
  }
  return BigNumber.from(hexBlock).toNumber()
}
