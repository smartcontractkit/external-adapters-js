import { Builder, Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  AdapterRequest,
  Config,
  ExecuteFactory,
  ExecuteWithConfig,
  MakeWSHandler,
  APIEndpoint,
} from '@chainlink/types'
import { DEFAULT_WS_API_ENDPOINT, makeConfig, NAME } from './config'
import { crypto } from './endpoint'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  return Builder.buildSelector(request, context, config, endpoints)
}

export const endpointSelector = (request: AdapterRequest): APIEndpoint =>
  Builder.selectEndpoint(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

export interface WSErrorType {
  TYPE: string
  MESSAGE: string
  PARAMETER: string
  INFO: string
}

export const INVALID_SUB = 'INVALID_SUB'

export const makeWSHandler = (config?: Config): MakeWSHandler => {
  // https://min-api.cryptocompare.com/documentation/websockets
  const subscriptions = {
    trade: 0,
    ticker: 2,
    aggregate: 5,
  }
  const getPair = (input: AdapterRequest) => {
    const validator = new Validator(
      input,
      { endpoint: false, ...crypto.inputParameters },
      {},
      false,
    )
    if (validator.error) return false
    const endpoint = validator.validated.data.endpoint?.toLowerCase()
    if (endpoint == 'marketcap') return false
    const base = validator.overrideSymbol(NAME)
    const quote = validator.validated.data.quote.toUpperCase()
    return `${base}~${quote}`
  }
  const getSubscription = (action: 'SubAdd' | 'SubRemove', pair?: string | boolean) => {
    if (!pair) return false
    return { action, subs: [`${subscriptions.aggregate}~CCCAGG~${pair}`] }
  }
  const withApiKey = (url: string, apiKey: string) => `${url}?api_key=${apiKey}`
  const shouldNotRetryAfterError = (error: WSErrorType): boolean => {
    return error.MESSAGE === INVALID_SUB
  }
  return () => {
    const defaultConfig = config || makeConfig()
    return {
      connection: {
        url: withApiKey(
          defaultConfig.api.baseWsURL || DEFAULT_WS_API_ENDPOINT,
          defaultConfig.apiKey || '',
        ),
        protocol: { query: { api_key: defaultConfig.apiKey } },
      },
      subscribe: (input) => getSubscription('SubAdd', getPair(input)),
      unsubscribe: (input) => getSubscription('SubRemove', getPair(input)),
      subsFromMessage: (message) =>
        getSubscription('SubAdd', `${message?.FROMSYMBOL}~${message?.TOSYMBOL}`),
      isError: (message: any) => Number(message.TYPE) > 400 && Number(message.TYPE) < 900,
      filter: (message) => {
        // Ignore everything is not from the wanted channels
        const code = Number(message.TYPE)
        const flag = Number(message.FLAGS) // flags = 4 (means price unchanged, PRICE parameter not included)
        return (code === subscriptions.ticker || code === subscriptions.aggregate) && flag !== 4
      },
      toResponse: (message: any) => {
        const result = Requester.validateResultNumber(message, ['PRICE'])
        return Requester.success('1', { data: { result } })
      },
      shouldNotRetrySubscription: (error) => shouldNotRetryAfterError(error as WSErrorType),
    }
  }
}
