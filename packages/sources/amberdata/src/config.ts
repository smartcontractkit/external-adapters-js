import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { AdapterRequest, Config, MakeWSHandler } from '@chainlink/types'
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

export const WSHandlerFactory = (defaultConfig?: Config): MakeWSHandler => {
  const subscriptions: any = {}
  const getPair = (input: AdapterRequest) => {
    const validator = new Validator(input, endpoint.price.customParams)
    if (validator.error) return
    const base = validator.overrideSymbol(NAME).toLowerCase()
    const quote = validator.validated.data.quote.toLowerCase()
    return `${base}_${quote}`
  }
  const getSubscription = (pair?: string) => {
    if (!pair) return
    return { id: 1, method: 'subscribe', params: ['market:tickers', { pair }] }
  }
  const getUnsubscription = (pair?: string) => {
    if (!pair) return
    return { id: 1, method: 'unsubscribe', params: [subscriptions[pair]] }
  }
  return () => {
    const config = defaultConfig || makeConfig()
    return {
      connection: {
        url: config.api.baseWsURL || DEFAULT_WS_API_ENDPOINT,
        protocol: { headers: { ...config.api.headers }}
      },
      subscribe: (input) =>  getSubscription(getPair(input)),
      unsubscribe: (input) =>  getUnsubscription(getPair(input)),
      subsFromMessage: (message) => {
        const pair = message?.params?.result?.pair
        subscriptions[pair] = message?.params?.subscription
        return getSubscription(message?.params?.result?.pair)
      },
      // https://github.com/web3data/web3data-js/blob/5b177803cb168dcaed0a8a6e2b2fbd835b82e0f9/src/websocket.js#L43
      isError: () => false, // Amberdata never receives error types?
      filter: (message: any) => !!message.params,
      toResponse: (message: any) => {
        const result = Requester.validateResultNumber(message, ['params', 'result', 'last'])
        return Requester.success('1', { data: { result } })
      }
    }
  }
}
