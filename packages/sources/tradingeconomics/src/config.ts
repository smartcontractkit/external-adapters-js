import { util, Validator, Requester } from '@chainlink/ea-bootstrap'
import { WSSubscriptionHandler, Config as DefaultConfig } from '@chainlink/types'
import { customParams } from './adapter'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    API_URL:
 *      required: false
 *      default: ws://stream.tradingeconomics.com/
 *    API_CLIENT_KEY:
 *      required: true
 *    API_CLIENT_SECRET:
 *      required: true
 *    SYMBOLS:
 *      required: true
 *    RECONNECT_TIMEOUT:
 *      required: false
 *      default: 3000
 */

export type Config = DefaultConfig & {
  url: string
  key: string
  secret: string
  symbols: string
  reconnectTimeout: number
}

const DEFAULT_WS_API_ENDPOINT = 'ws://stream.tradingeconomics.com/'

export const makeConfig = (prefix?: string): Config => {
  const defaultConfig = Requester.getDefaultConfig(prefix)
  return {
    ...defaultConfig,
    url: util.getEnv('API_URL', prefix) || DEFAULT_WS_API_ENDPOINT,
    key: util.getRequiredEnv('API_CLIENT_KEY', prefix),
    secret: util.getRequiredEnv('API_CLIENT_SECRET', prefix),
    symbols: util.getRequiredEnv('SYMBOLS', prefix),
    reconnectTimeout: Number(util.getEnv('RECONNECT_TIMEOUT', prefix) || 3000),
  }
}

// TODO: Needs testing
export const makeWSHandler = (config: Config): WSSubscriptionHandler => {
  const withApiKey = (url: string) => `${url}?client=${config.key}:${config.secret}`
  const getSubscription = (symbol: string) => ({ topic: 'subscribe', to: symbol})
  return {
    connection: {
      url: withApiKey(config.api.baseWsURL || DEFAULT_WS_API_ENDPOINT)
    },
    subscribe: (input) => {
      const validator = new Validator(input, customParams)
      if (validator.error) {
        // Validation failed, empty subscription will have no effect
        return ''
      }
      return getSubscription(validator.validated.data.base.toUpperCase())
    },
    subsFromMessage: (message) => getSubscription(`${message?.product_id}`),
    unsubscribe: () => '', 
    isError: (message: any) => message.type === 'error',
    // Ignore everything is not a ticker message. Throw an error on incoming errors.
    filter: (message: any) => message.type === 'ticker',
    parse: (message: any): number => {
      const result = Requester.validateResultNumber(message, ['price'])
      return result
    }
  }
}
