import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { logger } from '@chainlink/ea-bootstrap/src/lib/external-adapter'
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

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  return config
}

export const makeWSHandler = (): WSSubscriptionHandler => {
  return {
    connection: {
      url: 'wss://ws-feed.pro.coinbase.com', // TODO: Necessary?
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
    parse: (wsResponse: any): number => {
      if (wsResponse.type === 'error') {
        throw new Error(wsResponse.message)
      }
      if (wsResponse.type === 'subscriptions') {
        logger.debug('Subscription confirmed')
        // TODO: What to do here
        return 0
      }
      const result = Requester.validateResultNumber(wsResponse, ['price'])
      console.log('PRICE FROM WS:', result)
      return result

    }
  }
}
