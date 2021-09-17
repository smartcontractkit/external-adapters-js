import { Builder, Requester } from '@chainlink/ea-bootstrap'
import {
  Config,
  ExecuteWithConfig,
  ExecuteFactory,
  AdapterRequest,
  APIEndpoint,
  MakeWSHandler,
} from '@chainlink/types'
import { makeConfig } from './config'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  return Builder.buildSelector(request, context, config, endpoints)
}

export const endpointSelector = (request: AdapterRequest): APIEndpoint =>
  Builder.selectEndpoint(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
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

export const makeWSHandler = (config?: Config): MakeWSHandler => {
  return () => {
    const defaultConfig = config || makeConfig()
    return {
      connection: {
        url: defaultConfig.api.baseURL,
      },
      toSaveFromFirstMessage: (message: any) => ({
        subscriptionId: message.params.subscription,
      }),
      noHttp: true,
      subscribe: (input) => ({
        id: input.id,
        method: 'eth_subscribe',
        params: ['newHeads'],
      }),
      unsubscribe: (input, subscriptionParams) => ({
        id: input.id,
        method: 'eth_unsubscribe',
        params: [subscriptionParams.subscriptionId],
      }),
      subsFromMessage: (_, subscriptionMsg) => {
        return {
          id: subscriptionMsg.id,
          method: 'eth_subscribe',
          params: ['newHeads'],
        }
      },
      isError: () => false,
      filter: (message) => message.method === 'eth_subscription',
      toResponse: async (message: any, input: AdapterRequest) => {
        const hexedBlockNum: string = message.params.result.number
        const block: Block = await getBlock(input.id, hexedBlockNum, message.jsonrpc, defaultConfig)
        const medianGasPrice = getMedianGasPrice(block)
        return Requester.success(input.id, { data: { result: medianGasPrice } })
      },
    }
  }
}

const getBlock = async (
  id: string,
  hexedBlockNumber: string,
  jsonrpc: string,
  config: Config,
): Promise<Block> => {
  const requestConfig = {
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
