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

export const makeWSHandler = (): WSSubscriptionHandler => {
  return {
    connection: {
      url: DEFAULT_WS_API_ENDPOINT, // TODO: Necessary?
    },
    subscribe: (input) => {
      const validator = new Validator(input, customParams)
      if (validator.error) {
        // Validation failed, empty subscription will have no effect
        return ''
      }
      const symbol = validator.validated.data.symbol.toUpperCase()
      const convert = validator.validated.data.convert.toUpperCase()
      const subscriptionMsg = { type: 'subscribe', channels: ['ticker'], product_ids: [`${symbol}-${convert}`] }
      return subscriptionMsg
    },
    filter: (message: any) => {
      // Ignore everything is not a ticker message. Throw an error on incoming errors.
      if (message.type === 'error') throw new Error(message.message)
      return message.type !== 'ticker'
    },
    parse: (message: any): number => {
      const result = Requester.validateResultNumber(message, ['price'])
      return result

    },
    toAdapterResponse: (result: any) => {
      return Requester.success('1', { data: { result } })
    }
  }
}
