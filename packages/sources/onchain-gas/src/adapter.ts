import { Builder, Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  Config,
  ExecuteWithConfig,
  ExecuteFactory,
  AdapterRequest,
  APIEndpoint,
  MakeWSHandler,
} from '@chainlink/ea-bootstrap'
import { DEFAULT_BLOCK_IDX, makeConfig } from './config'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<Config, endpoints.TInputParameters> = async (
  request,
  context,
  config,
) => {
  return Builder.buildSelector<Config, endpoints.TInputParameters>(
    request,
    context,
    config,
    endpoints,
  )
}

export const endpointSelector = (
  request: AdapterRequest,
): APIEndpoint<Config, endpoints.TInputParameters> =>
  Builder.selectEndpoint<Config, endpoints.TInputParameters>(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<Config, endpoints.TInputParameters> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

interface Message {
  jsonrpc: string
  params: { result: { number: string }; subscription: string }
  method: string
}

export const makeWSHandler = (
  config?: Config,
): MakeWSHandler<
  Message | any // TODO: full WS message types
> => {
  return () => {
    const defaultConfig = config || makeConfig()
    return {
      connection: {
        url: defaultConfig.api?.baseURL,
      },
      toSaveFromFirstMessage: (message: Message) => {
        if (message.method !== 'eth_subscription' || !message.params) return
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
      unsubscribe: (input, subscriptionParams: any) => ({
        id: input.id,
        method: 'eth_unsubscribe',
        params: [subscriptionParams.subscriptionId],
      }),
      subsFromMessage: (_, subscriptionMsg: any) => {
        return {
          id: subscriptionMsg.id,
          method: 'eth_subscribe',
          params: ['newHeads'],
        }
      },
      isError: () => false,
      filter: (message: Message) => message.method === 'eth_subscription',
      toResponse: async (message: Message, input: AdapterRequest) => {
        const validator = new Validator(input, endpoints.gas.inputParameters)

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
