import { Requester, Validator, Builder } from '@chainlink/ea-bootstrap'
import {
  Config,
  ExecuteWithConfig,
  ExecuteFactory,
  MakeWSHandler,
  AdapterRequest,
} from '@chainlink/types'
import { makeConfig, DEFAULT_WS_API_ENDPOINT } from './config'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  return Builder.buildSelector(request, context, config, endpoints)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

export const makeWSHandler = (config?: Config): MakeWSHandler => {
  const getSubscription = (symbol?: string, subscribe = true) => {
    if (!symbol) return
    return {
      method: subscribe ? 'SUBSCRIBE' : 'UNSUBSCRIBE',
      params: [`${symbol}@miniTicker`],
      id: 1,
    }
  }
  const getSymbol = (input: AdapterRequest) => {
    const validator = new Validator(input, endpoints.crypto.inputParameters, {}, false)
    if (validator.error) return
    const symbol = validator.validated.data.base.toUpperCase()
    const convert = validator.validated.data.quote.toUpperCase()
    return `${symbol.toLowerCase()}${convert.toLowerCase()}`
  }
  return () => {
    const defaultConfig = config || makeConfig()
    return {
      connection: {
        url: defaultConfig.api.baseWsURL || DEFAULT_WS_API_ENDPOINT,
      },
      subscribe: (input) => getSubscription(getSymbol(input)),
      unsubscribe: (input) => getSubscription(getSymbol(input), false),
      subsFromMessage: (message) => {
        if (!message.s) return undefined
        return getSubscription(`${message.s.toLowerCase()}`)
      },
      isError: (message: any) => message.type === 'error',
      // Ignore everything is not a ticker message. Throw an error on incoming errors.
      filter: (message: any) => message.e === '24hrMiniTicker',
      toResponse: (message: any) => {
        const result = Requester.validateResultNumber(message, ['c'])
        return Requester.success('1', { data: { result } })
      },
    }
  }
}
