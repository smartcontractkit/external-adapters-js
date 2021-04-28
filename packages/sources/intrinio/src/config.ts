import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { WSSubscriptionHandler, Config } from '@chainlink/types'
import { customParams } from './adapter'
var IntrinioRealtime = require('intrinio-realtime')

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    API_KEY:
 *      required: true
 */

export const NAME = 'INTRINIO'

export const DEFAULT_API_ENDPOINT = 'https://api-v2.intrinio.com/'
// const DEFAULT_WS_API_ENDPOINT = ''

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  return config
}

export const makeWSHandler = (config: Config): WSSubscriptionHandler => {
  // https://github.com/intrinio/intrinio-realtime-node-sdk
  const ws = new IntrinioRealtime({
    api_key: config.apiKey,
    provider: 'iex',
  })
  return {
    init: obj =>
      new Promise(async (res, rej) => {
        try {
          await ws._refreshToken()
          obj.connection.url = ws._makeSocketUrl()
          res(0)
        } catch (e) {
          rej()
        }
      }),
    connection: {
      url: '',
    },
    subscribe: input => {
      const validator = new Validator(input, customParams)
      if (validator.error) {
        return
      }
      const base = validator.overrideSymbol(NAME).toUpperCase()
      return ws._makeJoinMessage(base)
    },
    unsubscribe: () => '',
    subsFromMessage: message => ws._makeJoinMessage(message.payload.ticker),
    isError: (message: any) => Number(message.TYPE) > 400 && Number(message.TYPE) < 900,
    filter: message => {
      console.log('filter', message)
      return message.event == 'quote' && message.payload?.type == 'last'
    },
    parse: (wsResponse: any): number => {
      console.log('parse', wsResponse)
      return Number(wsResponse?.payload?.price)
    },
  }
}
