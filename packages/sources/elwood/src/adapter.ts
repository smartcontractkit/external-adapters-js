import {
  AxiosRequestConfig,
  Builder,
  Logger,
  UnknownWSMessage,
  Validator,
} from '@chainlink/ea-bootstrap'
import {
  AdapterRequest,
  APIEndpoint,
  Config,
  ExecuteWithConfig,
  ExecuteFactory,
  MakeWSHandler,
  Requester,
  util,
} from '@chainlink/ea-bootstrap'
import { makeConfig } from './config'
import * as endpoints from './endpoint'
import { PriceResponse, SubscribeRequest } from './types'

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
  (config?: Config): MakeWSHandler<UnknownWSMessage> =>
  () => {
    const wsConfig = config || makeConfig()

    const handleSubscription = (action: 'subscribe' | 'unsubscribe') => (input: AdapterRequest) => {
      try {
        const subscriptionMsg = getSubscribeRequest(getPair(input), action)

        /*
        Note: normally handleSubscription just returns the subscription string for use in the WS connection,
        but Elwood is unique in that it subscribes to WS feeds using a POST request. Waiting for
        the return value from the async request would require updating every instance of
        wsHandler.subscribe and wsHandler.unsubscribe in the core framework, so this is left
        as a send-and-forget request until the core framework supports this style of subscription.
        */

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
      subsFromMessage: (wsMessage: UnknownWSMessage) => {
        if (!util.isObject(wsMessage)) return
        const message = wsMessage as Record<string, unknown>

        if (!(message.type === 'Index' && util.isObject(message.data))) return
        const messageWithData = message as { data: Record<string, unknown> } & Record<
          string,
          unknown
        >

        if (typeof messageWithData.data.symbol !== 'string') return

        return getSubscribeRequest(messageWithData.data.symbol, 'subscribe')
      },
      toResponse: (wsMessage: UnknownWSMessage, input: AdapterRequest) => {
        const result = Requester.validateResultNumber((wsMessage as PriceResponse).data.price)
        return Requester.success(input.id, { data: { result } }, wsConfig.verbose)
      },
      filter: (wsMessage: UnknownWSMessage) => {
        if (!util.isObject(wsMessage)) return false
        const message = wsMessage as Record<string, unknown>
        return message.type === 'Index' && util.isObject(message.data) // Confirms wsMessage can be used as PriceResponse for our purposes
      },
      isError: (wsMessage: UnknownWSMessage) => {
        return (
          typeof (wsMessage as PriceResponse).data.symbol !== 'string' ||
          typeof (wsMessage as PriceResponse).data.price !== 'string'
        )
      },
    }
  }
