import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { MakeWSHandler, Config, AdapterRequest } from '@chainlink/types'
import * as endpoint from './endpoint'
/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    API_KEY:
 *      required: true
 *
 */

export const NAME = 'CRYPTOCOMPARE'

export const DEFAULT_ENDPOINT = 'price'
export const DEFAULT_API_ENDPOINT = 'https://min-api.cryptocompare.com'
const DEFAULT_WS_API_ENDPOINT = 'wss://streamer.cryptocompare.com/v2'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  if (config.apiKey)
    config.api.headers = {
      ...config.api.headers,
      authorization: `Apikey ${config.apiKey}`,
    }
  return config
}

export const WSHandlerFactory = (config?: Config): MakeWSHandler => {
  // https://min-api.cryptocompare.com/documentation/websockets
  const subscriptions = {
    trade: 0,
    ticker: 2,
    aggregate: 5
  }
  const getPair = (input: AdapterRequest) => {
    const validator = new Validator(input, endpoint.price.customParams)
    if (validator.error) return
    const base = validator.overrideSymbol(NAME).toUpperCase()
    const quote = validator.validated.data.quote.toUpperCase()
    return `${base}~${quote}`
  }
  const getSubscription = (action: 'SubAdd' | 'SubRemove', pair?: string) => {
    if (!pair) return
    return { action, subs: [`${subscriptions.aggregate}~CCCAGG~${pair}`] }
  }
  const withApiKey = (url: string, apiKey: string) => `${url}?api_key=${apiKey}`
  return () => {
    const defaultConfig = config || makeConfig()
    return {
      connection: {
        url: withApiKey(defaultConfig.api.baseWsURL || DEFAULT_WS_API_ENDPOINT, defaultConfig.apiKey || ''),
        protocol: { query: { api_key: defaultConfig.apiKey } }
      },
      subscribe: (input) => getSubscription('SubAdd', getPair(input)),
      unsubscribe: (input) => getSubscription('SubRemove', getPair(input)),
      subsFromMessage: (message) => getSubscription('SubAdd', `${message?.FROMSYMBOL}~${message?.TOSYMBOL}`),
      isError: (message: any) => Number(message.TYPE) > 400 && Number(message.TYPE) < 900,
      filter: (message) => {
        // Ignore everything is not from the wanted channels
        const code = Number(message.TYPE)
        return code === subscriptions.ticker || code === subscriptions.aggregate
      },
      toResponse: (message: any) => {
        const result = Requester.validateResultNumber(message, ['PRICE'])
        return Requester.success('1', { data: { result } })
      }
    }
  }
}
