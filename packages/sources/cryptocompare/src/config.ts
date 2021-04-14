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
  return {
    connection: {
      url: DEFAULT_WS_API_ENDPOINT,
      protocol: { params: { api_key: config.apiKey } }
    },
    subscribe: (input) => {
      const validator = new Validator(input, endpoint.price.customParams)
      if (validator.error) {
        return 
      }
      const base = validator.overrideSymbol(NAME).toUpperCase()
      const quote = validator.validated.data.quote.toUpperCase()
      return {
        action: 'SubAdd',
        subs: [`${subscriptions.ticker}~*~${base}~${quote}`]
      }
    },
    filter: (message) => {
      // Ignore everything is not from the wanted channels. Throws on error messages
      const code = Number(message.TYPE)
      if (code > 400) throw new Error(`${NAME}: ${message.INFO}`)
      return code !== subscriptions.ticker || code !== subscriptions.aggregate
    },
    parse: (wsResponse: any): number => {
      const result = Requester.validateResultNumber(wsResponse, ['rate'])
      return result

    },
    toAdapterResponse: (result: any) => {
      return Requester.success('1', { data: { result } })
    }
  }
}
