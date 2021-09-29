import { Builder, Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  Config,
  ExecuteWithConfig,
  ExecuteFactory,
  AdapterRequest,
  APIEndpoint,
  MakeWSHandler,
} from '@chainlink/types'
import { DEFAULT_BLOCK_IDX, makeConfig } from './config'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  return Builder.buildSelector(request, context, config, endpoints)
}

export const endpointSelector = (request: AdapterRequest): APIEndpoint =>
  Builder.selectEndpoint(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

export const makeWSHandler = (config?: Config): MakeWSHandler => {
  return () => {
    const defaultConfig = config || makeConfig()
    return {
      connection: {
        url: defaultConfig.api.baseURL,
      },
      toSaveFromFirstMessage: (message: any) => {
        if (message.method !== 'eth_subscription' || !message.params) return null
        return {
          subscriptionId: message.params.subscription,
        }
      },
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
        const validator = new Validator(input, endpoints.gas.inputParameters)
        if (validator.error) throw validator.error
        const hexedBlockNum: string = message.params.result.number
        const medianGasPrices = await endpoints.gas.getTransactionsInPastBlocks(
          input.id,
          message.jsonrpc,
          hexedBlockNum,
          validator.validated.data.numBlocks,
          defaultConfig,
        )
        const blockIdx = validator.validated.data.blockIdx || DEFAULT_BLOCK_IDX
        return Requester.success(
          input.id,
          {
            data: {
              values: medianGasPrices,
              result: medianGasPrices[Math.min(blockIdx, medianGasPrices.length - 1)],
            },
          },
          defaultConfig.verbose,
        )
      },
    }
  }
}
