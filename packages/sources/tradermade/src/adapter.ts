import { Builder } from '@chainlink/ea-bootstrap'
import {
  Config,
  ExecuteWithConfig,
  MakeWSHandler,
  AdapterRequest,
  APIEndpoint,
} from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { makeConfig, DEFAULT_WS_API_ENDPOINT } from './config'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  return Builder.buildSelector(request, context, config, endpoints)
}

export const endpointSelector = (request: AdapterRequest): APIEndpoint =>
  Builder.selectEndpoint(request, makeConfig(), endpoints)

const customParams = {
  base: ['base', 'from', 'symbol', 'market'],
  quote: ['quote', 'to', 'market', 'convert'],
}

export const makeWSHandler = (config?: Config): MakeWSHandler => {
  const getSubscription = (pair?: string) => {
    if (!pair) return
    const sub = {
      userKey: config.api.baseWsURL,
      symbol: pair,
    }
    return sub
  }
  const getPair = (input: AdapterRequest) => {
    const validator = new Validator(input, customParams, {}, false)
    if (validator.error) return
    const base = validator.validated.data.base.toUpperCase()
    const quote = validator.validated.base.quote.toUpperCase()
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
        if (!message.s) return undefined
        return getSubscription(`${message.s.toUpperCase()}`)
      },
      isError: (message: any) => message['status_code'] && message['status_code'] !== 200,
      filter: (message: any) => !!message.p,
      toResponse: (message: any) => {
        const result = Requester.validateResultNumber(message, ['p'])
        return Requester.success('1', { data: { result } })
      },
    }
  }
}
