import { Builder } from '@chainlink/ea-bootstrap'
import {
  Config,
  ExecuteWithConfig,
  MakeWSHandler,
  AdapterRequest,
  APIEndpoint,
  ExecuteFactory,
} from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { makeConfig, DEFAULT_WS_API_ENDPOINT } from './config'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  return Builder.buildSelector(request, context, config, endpoints)
}

export const endpointSelector = (request: AdapterRequest): APIEndpoint =>
  Builder.selectEndpoint(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

const customParams = {
  base: ['base', 'from', 'symbol', 'market'],
  quote: ['quote', 'to', 'market', 'convert'],
}

export const makeWSHandler = (config?: Config): MakeWSHandler => {
  const getSubscription = (pair?: string) => {
    const defaultConfig = config || makeConfig()
    if (!pair) return
    const sub = {
      userKey: defaultConfig.wsApiKey,
      symbol: pair,
    }
    return sub
  }
  const getPair = (input: AdapterRequest) => {
    const validator = new Validator(input, customParams, {}, false)
    if (validator.error) return
    const base = validator.validated.data.base.toUpperCase()
    const quote = validator.validated.data.quote.toUpperCase()
    return `${base}${quote}`
  }
  return () => {
    const defaultConfig = config || makeConfig()
    return {
      connection: {
        url: defaultConfig.api.baseWsURL || DEFAULT_WS_API_ENDPOINT,
      },
      shouldNotServeInputUsingWS: (input: AdapterRequest) => input.data.endpoint !== 'forex',
      subscribe: (input: AdapterRequest) => getSubscription(getPair(input)),
      unsubscribe: () => null, // Tradermade does not support unsubscribing.
      subsFromMessage: (message) => {
        if (!message.symbol) return undefined
        return getSubscription(message.symbol)
      },
      isError: () => false, // No error
      filter: (message: any) => !!message.mid,
      toResponse: (message: any) => {
        const result = Requester.validateResultNumber(message, ['mid'])
        return Requester.success('1', { data: { result } })
      },
    }
  }
}
