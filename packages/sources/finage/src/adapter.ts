import {
  AdapterRequest,
  APIEndpoint,
  ExecuteFactory,
  ExecuteWithConfig,
  MakeWSHandler,
} from '@chainlink/types'
import { Builder, Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, makeConfig, NAME } from './config'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  return Builder.buildSelector(request, context, config, endpoints)
}

export const endpointSelector = (request: AdapterRequest): APIEndpoint<Config> =>
  Builder.selectEndpoint(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

export const makeWSHandler = (config?: Config): MakeWSHandler => {
  const getSubscription = (symbols?: string, subscribe = true) => {
    if (!symbols) return
    return {
      action: subscribe ? 'subscribe' : 'unsubscribe',
      symbols,
    }
  }
  const getStockSymbol = (input: AdapterRequest) => {
    const validator = new Validator(input, endpoints.stock.inputParams, {}, false)
    if (validator.error) return
    return validator.validated.data.base.toUpperCase()
  }
  const isStock = (input: AdapterRequest): boolean =>
    endpoints.stock.supportedEndpoints.includes(input.data.endpoint)

  const getForexSymbol = (input: AdapterRequest) => {
    const validator = new Validator(input, endpoints.forex.inputParams, {}, false)
    if (validator.error) return
    const from = (validator.overrideSymbol(NAME) as string).toUpperCase()
    const to = validator.validated.data.quote.toUpperCase()
    return `${from}/${to}` // Note that this adds the "/", whereas the REST endpoint doesn't use this
  }
  const isForex = (input: AdapterRequest): boolean =>
    endpoints.forex.supportedEndpoints.includes(input.data.endpoint)

  const getSymbol = (input: AdapterRequest): string | undefined => {
    if (isStock(input)) {
      return getStockSymbol(input)
    } else if (isForex(input)) {
      return getForexSymbol(input)
    }
    return undefined
  }

  return () => {
    const defaultConfig = config || makeConfig()
    return {
      connection: {},
      programmaticConnectionInfo: (input) => {
        if (isStock(input)) {
          return {
            key: 'stock',
            url: defaultConfig.stockWsEndpoint,
          }
        } else if (isForex(input)) {
          return {
            key: 'forex',
            url: defaultConfig.forexWsEndpoint,
          }
        }
        return undefined
      },
      shouldNotServeInputUsingWS: (input) => !isForex(input) && !isStock(input),
      subscribe: (input) => getSubscription(getSymbol(input)),
      unsubscribe: (input) => getSubscription(getSymbol(input), false),
      subsFromMessage: (message) => {
        if (message.s) return getSubscription(message.s.toUpperCase())
        return undefined
      },
      isError: (message: any) => message['status_code'] && message['status_code'] !== 200,
      filter: (message: any) => !!message.p || (!!message.a && !!message.b),
      toResponse: (message: any) => {
        if (message.p) {
          const result = Requester.validateResultNumber(message, ['p'])
          return Requester.success('1', { data: { result } })
        }

        const ask = Requester.validateResultNumber(message, ['a'])
        const bid = Requester.validateResultNumber(message, ['b'])
        const result = (ask + bid) / 2
        return Requester.success('1', { data: { result } })
      },
    }
  }
}
