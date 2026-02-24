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
    [Networks.Base]: {
      value: 0,
      gasLimit: 0,
      gasPrice: 0,
      to: wallet.address,
    },
    [Networks.Linea]: {
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
    [Networks.Scroll]: {
      value: 0,
      gasLimit: 0,
      gasPrice: 0,
      to: wallet.address,
    },
    [Networks.zkSync]: {
      value: 0,
      gasLimit: 0,
      gasPrice: 0,
      to: wallet.address,
    },
    [Networks.Ink]: {
      value: 0,
      gasLimit: 0,
      gasPrice: 0,
      to: wallet.address,
    },
    [Networks.Mantle]: {
      value: 0,
      gasLimit: 0,
      gasPrice: 0,
      to: wallet.address,
    },
    [Networks.Unichain]: {
      value: 0,
      gasLimit: 0,
      gasPrice: 0,
      to: wallet.address,
    },
    [Networks.Soneium]: {
      value: 0,
      gasLimit: 0,
      gasPrice: 0,
      to: wallet.address,
    },
    [Networks.Celo]: {
      value: 0,
      gasLimit: 0,
      gasPrice: 0,
      to: wallet.address,
    },
    [Networks.Xlayer]: {
      value: 0,
      gasLimit: 0,
      gasPrice: 0,
      to: wallet.address,
    },
    [Networks.Megaeth]: {
      value: 0,
      gasLimit: 0,
      gasPrice: 0,
      to: wallet.address,
    },
    [Networks.Katana]: {
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

// Pure functions for block validation - exported for unit testing
export const isPastBlock = (block: number, lastSeenBlockNumber: number): boolean =>
  block <= lastSeenBlockNumber

export const isStaleBlock = (
  block: number,
  lastSeenBlockNumber: number,
  lastSeenTimestamp: number,
  delta: number,
): boolean => {
  return isPastBlock(block, lastSeenBlockNumber) && Date.now() - lastSeenTimestamp >= delta
}

export const isValidBlock = (
  block: number,
  lastSeenBlockNumber: number,
  deltaBlocks: number,
): boolean => lastSeenBlockNumber - block <= deltaBlocks

export const parseHexBlockNumber = (hexBlock: string | number): number => {
  if (!hexBlock) {
    throw new Error('Block number is empty or undefined')
  }
  return BigNumber.from(hexBlock).toNumber()
}

const lastSeenBlock: Record<EVMNetworks, { block: number; timestamp: number }> = {
  [Networks.Arbitrum]: {
    block: 0,
    timestamp: 0,
  },
  [Networks.Optimism]: {
    block: 0,
    timestamp: 0,
  },
  [Networks.Base]: {
    block: 0,
    timestamp: 0,
  },
  [Networks.Linea]: {
    block: 0,
    timestamp: 0,
  },
  [Networks.Metis]: {
    block: 0,
    timestamp: 0,
  },
  [Networks.Scroll]: {
    block: 0,
    timestamp: 0,
  },
  [Networks.zkSync]: {
    block: 0,
    timestamp: 0,
  },
  [Networks.Ink]: {
    block: 0,
    timestamp: 0,
  },
  [Networks.Mantle]: {
    block: 0,
    timestamp: 0,
  },
  [Networks.Unichain]: {
    block: 0,
    timestamp: 0,
  },
  [Networks.Soneium]: {
    block: 0,
    timestamp: 0,
  },
  [Networks.Celo]: {
    block: 0,
    timestamp: 0,
  },
  [Networks.Xlayer]: {
    block: 0,
    timestamp: 0,
  },
  [Networks.Megaeth]: {
    block: 0,
    timestamp: 0,
  },
  [Networks.Katana]: {
    block: 0,
    timestamp: 0,
  },
}

export const checkOptimisticRollupBlockHeight = (
  network: EVMNetworks,
): ((config: ExtendedConfig) => Promise<boolean>) => {
  const _updateLastSeenBlock = (block: number): void => {
    lastSeenBlock[network] = {
      block,
      timestamp: Date.now(),
    }
  }

  return async (config: ExtendedConfig): Promise<boolean> => {
    const { deltaBlocks, retryConfig } = config
    const delta = config.deltaChain[network]
    const block = await retry<number>({
      promise: async () => await requestBlockHeight(network),
      retryConfig,
    })
    if (!isValidBlock(block, lastSeenBlock[network].block, deltaBlocks))
      throw new AdapterResponseInvalidError({
        message: `Block found #${block} is previous to last seen #${lastSeenBlock[network].block} with more than ${deltaBlocks} difference`,
      })
    if (
      !isStaleBlock(block, lastSeenBlock[network].block, lastSeenBlock[network].timestamp, delta)
    ) {
      Logger.info(
        `[${network}] Block #${block} is not considered stale at ${Date.now()}. Last seen block #${
          lastSeenBlock[network].block
        } was at ${lastSeenBlock[network].timestamp}`,
      )
      if (!isPastBlock(block, lastSeenBlock[network].block)) _updateLastSeenBlock(block)
      return true
    }
    Logger.warn(
      `[${network}] Block #${block} is considered stale at ${Date.now()}. Last seen block #${
        lastSeenBlock[network].block
      } was at ${lastSeenBlock[network].timestamp}, more than ${delta} milliseconds ago.`,
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
