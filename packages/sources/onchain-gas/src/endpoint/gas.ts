import {
  Validator,
  Logger,
  Requester,
  AxiosRequestConfig,
  AdapterConfigError,
} from '@chainlink/ea-bootstrap'
import type { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { DEFAULT_NUM_BLOCKS, MAX_BLOCKS_TO_QUERY } from '../config'

export const supportedEndpoints = ['gas']

export type TInputParameters = { numBlocks: number; blockIdx: number }
export const inputParameters: InputParameters<TInputParameters> = {
  numBlocks: {
    required: false,
    default: 1,
    type: 'number',
    description: 'The number of blocks to use to determine the gas price.',
  },
  blockIdx: {
    required: false,
    default: 0,
    type: 'number',
    description: 'The index of the block used for the result field in the response',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request) => {
  new Validator(request, inputParameters)
  throw new AdapterConfigError({
    message:
      'The OnChain Gas adapter does not support making HTTP requests. Make sure WS is enabled in the adapter configuration.',
  })
}

interface Block {
  data: {
    result: {
      transactions: {
        gasPrice: string
      }[]
    }
  }
}

export const getTransactionsInPastBlocks = async (
  id: string,
  jsonrpc: string,
  latestHexedBlockNum: string,
  numBlocksToQuery = DEFAULT_NUM_BLOCKS,
  config: Config,
): Promise<number[]> => {
  const latestBlockNum = parseInt(latestHexedBlockNum, 16)
  const numBlocks = Math.min(MAX_BLOCKS_TO_QUERY, numBlocksToQuery)
  if (numBlocksToQuery > MAX_BLOCKS_TO_QUERY) {
    Logger.info(`Can only query a maximum of ${MAX_BLOCKS_TO_QUERY} blocks`)
  }
  const getBlocks = []
  for (let blockNum = latestBlockNum; blockNum > latestBlockNum - numBlocks; blockNum--) {
    const hexedBlockNum = `0x${blockNum.toString(16)}`
    getBlocks.push(getBlock(id, hexedBlockNum, jsonrpc, config))
  }
  const blocks = await Promise.all(getBlocks)
  return blocks.map((block) => getMedianGasPrice(block))
}

const getBlock = async (
  id: string,
  hexedBlockNumber: string,
  jsonrpc: string,
  config: Config,
): Promise<Block> => {
  const requestConfig: AxiosRequestConfig = {
    url: config.rpcUrl,
    data: {
      jsonrpc: jsonrpc,
      method: 'eth_getBlockByNumber',
      params: [hexedBlockNumber, true],
      id,
    },
    method: 'post',
  }
  return await Requester.request(requestConfig)
}

const getMedianGasPrice = (block: Block): number => {
  const blockTransactions = block.data.result.transactions
  const gasPrices = blockTransactions.map(({ gasPrice: hexedGasPrice }) =>
    parseInt(hexedGasPrice, 16),
  )
  const sortedPrices = gasPrices.sort((a, b) => b - a)
  const mid = Math.floor(sortedPrices.length / 2)
  if (sortedPrices.length % 2 === 0) {
    return (sortedPrices[mid - 1] + sortedPrices[mid]) / 2
  }
  return sortedPrices[mid]
}
