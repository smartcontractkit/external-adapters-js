import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { AdapterRequest, Config, MakeWSHandler } from '@chainlink/types'
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

export const makeWSHandler = (config?: Config): MakeWSHandler => {
  const getSubscription = (productId: string, subscribe = true) =>  ({ type: subscribe ? 'subscribe' : 'unsubscribe', channels: ['ticker'], product_ids: [productId] })
  const getProductId = (input: AdapterRequest) => {
    const validator = new Validator(input, customParams)
    if (validator.error) {
      // Validation failed, empty subscription will have no effect
      return ''
    }
    const symbol = validator.validated.data.symbol.toUpperCase()
    const convert = validator.validated.data.convert.toUpperCase()
    return `${symbol}-${convert}`
  }
  return () => {
    const defaultConfig = config || makeConfig()
    return {
      connection: {
        url: defaultConfig.api.baseWsURL || DEFAULT_WS_API_ENDPOINT
      },
      subscribe: (input) => getSubscription(getProductId(input)),
      unsubscribe: (input) => getSubscription(getProductId(input), false),
      subsFromMessage: (message) => getSubscription(`${message?.product_id}`),
      isError: (message: any) => message.type === 'error',
      // Ignore everything is not a ticker message. Throw an error on incoming errors.
      filter: (message: any) => message.type === 'ticker',
      parse: (message: any): number => {
        const result = Requester.validateResultNumber(message, ['price'])
        return result

      }
    }
  }
}
