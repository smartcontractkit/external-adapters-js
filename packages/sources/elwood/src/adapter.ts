import { AxiosRequestConfig, Builder, Logger, Validator } from '@chainlink/ea-bootstrap'
import {
  AdapterRequest,
  APIEndpoint,
  Config,
  ExecuteWithConfig,
  ExecuteFactory,
  MakeWSHandler,
  Requester,
} from '@chainlink/ea-bootstrap'
import { makeConfig } from './config'
import * as endpoints from './endpoint'
import { PriceResponse, ResponseMessage, SubscribeRequest } from './types'

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

const getPair = (input: AdapterRequest) => {
  const validator = new Validator(input, endpoints.price.inputParameters, {})
  const base = validator.validated.data.base.toUpperCase()
  const quote = validator.validated.data.quote.toUpperCase()
  return `${base}-${quote}`
}

const getSubscribeRequest = (
  pairSymbol: string,
  action: 'subscribe' | 'unsubscribe',
): SubscribeRequest => ({
  action: action,
  stream: 'index',
  symbol: pairSymbol,
  index_freq: 1_000, //ms
})

export const makeWSHandler =
  (
    config?: Config,
  ): MakeWSHandler<
    ResponseMessage | any // TODO: full WS message types
  > =>
  () => {
    const wsConfig = config || makeConfig()

    const handleSubscription = (action: 'subscribe' | 'unsubscribe') => (input: AdapterRequest) => {
      try {
        const subscriptionMsg = getSubscribeRequest(getPair(input), action)

        const data: AxiosRequestConfig = {
          url: wsConfig.api?.baseURL,
          headers: {
            ...wsConfig.api?.headers,
            apiKey: wsConfig.apiKey ?? '',
          },
          method: 'post',
          data: subscriptionMsg,
        }

        Requester.request(data)

        return subscriptionMsg
      } catch (e) {
        const error = e as Error
        Logger.error(error.message)
        return undefined
      }
    }

    return {
      connection: { url: `${wsConfig?.ws?.baseWsURL}?apiKey=${wsConfig.apiKey}` },
      noHttp: true,
      subscribe: handleSubscription('subscribe'),
      unsubscribe: handleSubscription('unsubscribe'),
      subsFromMessage: (message: ResponseMessage) => {
        if (!('type' in message && message.type === 'Index')) return
        const subInMessage = getSubscribeRequest(message.data?.symbol, 'subscribe')
        if (!message.data?.symbol || !subInMessage) return
        return subInMessage
      },
      toResponse: (message: PriceResponse, input: AdapterRequest) => {
        const result = Requester.validateResultNumber(message.data.price)
        return Requester.success(input.id, { data: { result } }, wsConfig.verbose)
      },
      filter: (message: ResponseMessage) => 'type' in message && message.type === 'Index',
      isError: (message: ResponseMessage) =>
        message.type === 'Index' && !(message.data?.price && message.data?.symbol),
    }
  }
