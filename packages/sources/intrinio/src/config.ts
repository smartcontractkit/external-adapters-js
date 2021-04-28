import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { MakeWSHandler, Config, AdapterRequest } from '@chainlink/types'
import { customParams } from './adapter'
import IntrinioRealtime from 'intrinio-realtime'

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

export const makeWSHandler = (config?: Config): MakeWSHandler => {
  // https://github.com/intrinio/intrinio-realtime-node-sdk

  const getBase = (input: AdapterRequest): string => {
    const validator = new Validator(input, customParams)
    if (validator.error) {
      return ''
    }
    return validator.overrideSymbol(NAME).toUpperCase()
  }

  return () => {
    const defaultConfig = config || makeConfig()

    const ws = new IntrinioRealtime({
      api_key: defaultConfig.apiKey,
      provider: 'iex',
    })

    return {
      init: obj =>
        new Promise((res, rej) => {
          ws._refreshToken()
            .then(() => {
              obj.connection.url = ws._makeSocketUrl()
              res(0)
            })
            .catch((e: any) => rej(e))
        }),
      connection: {
        url: '',
      },
      subscribe: input => ws._makeJoinMessage(getBase(input)),
      unsubscribe: (input) => ws._makeLeaveMessage(getBase(input)),
      subsFromMessage: message => ws._makeJoinMessage(message.payload.ticker),
      isError: (message: any) => Number(message.TYPE) > 400 && Number(message.TYPE) < 900,
      filter: message => message.event == 'quote' && message.payload?.type == 'last',
      parse: (wsResponse: any): number => Number(wsResponse?.payload?.price),
    }
  }
}
