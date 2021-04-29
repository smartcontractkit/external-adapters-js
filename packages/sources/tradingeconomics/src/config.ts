import { util, Requester, Validator } from '@chainlink/ea-bootstrap'
import { WSSubscriptionHandler, Config as config } from '@chainlink/types'
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

export type Config = config & {
  client: {
    key: string
    secret: string
  }
}

export const NAME = 'TRADINGECONOMICS'

export const DEFAULT_API_ENDPOINT = 'https://api.tradingeconomics.com/markets'
const DEFAULT_WS_API_ENDPOINT = 'ws://stream.tradingeconomics.com/'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT

  return {
    ...config,
    client: {
      key: util.getRequiredEnv('API_CLIENT_KEY', prefix),
      secret: util.getRequiredEnv('API_CLIENT_SECRET', prefix),
    },
  }
}

export const makeWSHandler = (config: Config): WSSubscriptionHandler => {
  // http://api.tradingeconomics.com/documentation/Streaming
  // https://github.com/boxhock/tradingeconomics-nodejs-stream/blob/master/src/index.ts
  const withApiKey = (url: string, key: string, secret: string) => `${url}?client=${key}:${secret}`
  const getSubscription = (to: string) => ({ topic: 'subscribe', to })

  return {
    connection: {
      url: withApiKey(
        config.api.baseWsURL || DEFAULT_WS_API_ENDPOINT,
        config.client.key || '',
        config.client.secret || '',
      ),
    },
    subscribe: input => {
      const validator = new Validator(input, customParams)
      if (validator.error) {
        return
      }
      const base = validator.overrideSymbol(NAME).toUpperCase()
      return getSubscription(base)
    },
    unsubscribe: () => '',
    subsFromMessage: () => '',
    isError: (message: any) => Number(message.TYPE) > 400 && Number(message.TYPE) < 900,
    filter: message => {
      return message.topic && message.topic !== 'keepalive'
    },
    parse: (wsResponse: any): number => Number(wsResponse?.price),
  }
}
