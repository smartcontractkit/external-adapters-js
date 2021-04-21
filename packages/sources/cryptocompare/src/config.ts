import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { WSSubscriptionHandler, Config } from '@chainlink/types'
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

export const makeWSHandler = (config: Config): WSSubscriptionHandler => {
  // https://min-api.cryptocompare.com/documentation/websockets
  const subscriptions = {
    trade: 0,
    ticker: 2,
    aggregate: 5
  }
  const getSubscription = (pair: string) => ({ action: 'SubAdd', subs: [`${subscriptions.aggregate}~CCCAGG~${pair}`] })
  const withApiKey = (url: string, apiKey: string) => `${url}?api_key=${apiKey}`
  return {
    connection: {
      url: withApiKey(config.api.baseWsURL || DEFAULT_WS_API_ENDPOINT, config.apiKey || ''),
      protocol: { query: { api_key: config.apiKey } }
    },
    subscribe: (input) => {
      const validator = new Validator(input, endpoint.price.customParams)
      if (validator.error) {
        return 
      }
      const base = validator.overrideSymbol(NAME).toUpperCase()
      const quote = validator.validated.data.quote.toUpperCase()
      return getSubscription(`${base}~${quote}`)
    },
    unsubscribe: () => '', // Maybe store the subs ID in order to unsubscribe?
    subsFromMessage: (message) => getSubscription(`${message?.FROMSYMBOL}~${message?.TOSYMBOL}`),
    isError: (message: any) => Number(message.TYPE) > 400 && Number(message.TYPE) < 900,
    filter: (message) => {
      // Ignore everything is not from the wanted channels
      const code = Number(message.TYPE)
      return code === subscriptions.ticker || code === subscriptions.aggregate
    },
    parse: (wsResponse: any): number => Number(wsResponse?.PRICE)
  }
}
