import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, WSSubscriptionHandler } from '@chainlink/types'
import * as endpoint from './endpoint'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    API_KEY:
 *      required: true
 *
 */

export const NAME = 'AMBERDATA'

export const DEFAULT_API_ENDPOINT = 'https://web3api.io'
export const DEFAULT_WS_API_ENDPOINT = 'wss://ws.web3api.io'

export const DEFAULT_ENDPOINT = 'price'

export const makeConfig = (prefix = ''): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.headers['x-api-key'] = config.apiKey
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  return config
}

export const makeWSHandler = (config: Config): WSSubscriptionHandler => {
  const getSubscription = (pair: string) => ({ id: 1, method: 'subscribe', params: ['market:tickers', { pair }] })
  return {
    connection: {
      url: config.api.baseWsURL || DEFAULT_WS_API_ENDPOINT,
      protocol: { headers: { ...config.api.headers }}
    },
    subscribe: (input) => {
      // TODO: What to do with different enpoints? Should every endpoint have its own WS Handler?
      const validator = new Validator(input, endpoint.price.customParams)
      if (validator.error) {
        return 
      }
      const base = validator.overrideSymbol(NAME).toLowerCase()
      const quote = validator.validated.data.quote.toLowerCase()
      return getSubscription(`${base}_${quote}`)
    },
    unsubscribe: () => {
      return ''
    },
    subsFromMessage: (message) => getSubscription(message?.params?.result?.pair),
    // https://github.com/web3data/web3data-js/blob/5b177803cb168dcaed0a8a6e2b2fbd835b82e0f9/src/websocket.js#L43
    isError: (message) => typeof message.result === 'boolean',
    filter: (message: any) => !!message.params,
    parse: (wsResponse: any): number => {
      const result = Requester.validateResultNumber(wsResponse, ['params', 'result', 'last'])
      return result

    }
  }
}
