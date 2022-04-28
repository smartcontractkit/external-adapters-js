import { Builder, Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  AdapterRequest,
  APIEndpoint,
  Config,
  ExecuteWithConfig,
  ExecuteFactory,
  MakeWSHandler,
} from '@chainlink/types'
import { DEFAULT_BASE_WS_URL, makeConfig } from './config'
import * as endpoints from './endpoint'
import {
  AuthenticationRequest,
  PriceUpdateResponse,
  ResponseMessage,
  SubscribeRequest,
  UnsubscribeRequest,
} from './types'

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  return Builder.buildSelector(request, context, config, endpoints)
}

export const endpointSelector = (request: AdapterRequest): APIEndpoint =>
  Builder.selectEndpoint(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

export const makeWSHandler = (config?: Config): MakeWSHandler => {
  const wsConfig = config || makeConfig()

  const getPair = (input: AdapterRequest) => {
    const validator = new Validator(
      input,
      endpoints.price.inputParameters,
      {},
      { shouldThrowError: false },
    )
    if (validator.error) return
    const base = validator.validated.data.base.toUpperCase()
    const quote = validator.validated.data.quote.toUpperCase()
    return base + quote
  }

  return () => ({
    connection: { url: DEFAULT_BASE_WS_URL },
    onConnect: (): AuthenticationRequest => ({
      jsonrpc: '2.0',
      method: 'authentication_logon',
      params: { api_key: wsConfig.apiKey },
    }),
    noHttp: true,
    subscribe: (input: AdapterRequest): SubscribeRequest => ({
      jsonrpc: '2.0',
      method: 'vwap_subscribe',
      params: { tickers: [getPair(input)] },
    }),
    unsubscribe: (input: AdapterRequest): UnsubscribeRequest => ({
      jsonrpc: '2.0',
      method: 'vwap_unsubscribe',
      params: { tickers: [getPair(input)] },
    }),
    subsFromMessage: (message: ResponseMessage, subscriptionMsg: SubscribeRequest) => {
      if (!('method' in message && message.method === 'vwap')) return
      const subInMessage = message.params.updates.find((u) =>
        subscriptionMsg.params.tickers?.includes(u.ticker),
      )
      if (!subInMessage) return
      return subscriptionMsg
    },
    toResponse: (message: PriceUpdateResponse, input: AdapterRequest) => {
      const result = Requester.validateResultNumber(message, ['price'])
      return Requester.success(input.id, { data: { result } }, wsConfig.verbose)
    },
    filter: (message: ResponseMessage) => 'method' in message && message.method === 'vwap',
    isError: (message: ResponseMessage) => 'error' in message,
  })
}
