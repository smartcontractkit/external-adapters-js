import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, WSSubscriptionHandler } from '@chainlink/types'
import { customParams } from './endpoint/price'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *
 */

export const DEFAULT_ENDPOINT = 'price'
export const DEFAULT_API_ENDPOINT = 'https://api.coinbase.com'
export const DEFAULT_WS_API_ENDPOINT = 'wss://ws-feed.pro.coinbase.com'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  return config
}

export const makeWSHandler = (config: Config): WSSubscriptionHandler => {
  const getSubscription = (productId: string) =>  ({ type: 'subscribe', channels: ['ticker'], product_ids: [productId] })
  return {
    connection: {
      url: config.api.baseWsURL || DEFAULT_WS_API_ENDPOINT
    },
    subscribe: (input) => {
      const validator = new Validator(input, customParams)
      if (validator.error) {
        // Validation failed, empty subscription will have no effect
        return ''
      }
      const symbol = validator.validated.data.symbol.toUpperCase()
      const convert = validator.validated.data.convert.toUpperCase()
      // return { message: `${symbol}_${convert}` }
      return getSubscription(`${symbol}-${convert}`)
    },
    subsFromMessage: (message) => getSubscription(`${message?.product_id}`),
    unsubscribe: () => '', // Maybe store the subs ID in order to unsubscribe?
    isError: (message: any) => message.type === 'error',
    // Ignore everything is not a ticker message. Throw an error on incoming errors.
    filter: (message: any) => message.type === 'ticker',
    parse: (message: any): number => {
      const result = Requester.validateResultNumber(message, ['price'])
      return result

    }
  }
}
