import { Requester, Validator, Builder } from '@chainlink/ea-bootstrap'
import {
  AdapterRequest,
  Config,
  ExecuteFactory,
  ExecuteWithConfig,
  MakeWSHandler,
} from '@chainlink/types'
import { DEFAULT_WS_API_ENDPOINT, makeConfig, NAME } from './config'
import * as endpoints from './endpoint'
import { crypto } from './endpoint'

// Export function to integrate with Chainlink node
export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  return Builder.buildSelector(request, context, config, endpoints)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

export const makeWSHandler = (defaultConfig?: Config): MakeWSHandler => {
  const subscriptions: any = {}
  const getPair = (input: AdapterRequest) => {
    const validator = new Validator(input, crypto.inputParameters, {}, false)
    if (validator.error) return
    const base = (validator.overrideSymbol(NAME) as string).toLowerCase()
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
        protocol: { headers: { ...config.api.headers } },
      },
      subscribe: (input) => getSubscription(getPair(input)),
      unsubscribe: (input) => getUnsubscription(getPair(input)),
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
      },
    }
  }
}
