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
import overrides from './config/symbols.json'

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  return Builder.buildSelector(request, context, config, endpoints)
}

export const endpointSelector = (request: AdapterRequest): APIEndpoint<Config> =>
  Builder.selectEndpoint(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

interface Message {
  p: string
  a: string
  b: string
  s: string
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
    const validator = new Validator(
      input,
      endpoints.stock.inputParameters,
      {},
      { shouldThrowError: false, overrides },
    )
    if (validator.error) return
    return validator.validated.data.base.toUpperCase()
  }
  const isStock = (input: AdapterRequest): boolean =>
    endpoints.stock.supportedEndpoints.includes(input.data.endpoint)

  const isCrypto = (input: AdapterRequest): boolean =>
    endpoints.crypto.supportedEndpoints.includes(input.data.endpoint)

  const getCryptoSymbol = (input: AdapterRequest) => {
    const validator = new Validator(
      input,
      endpoints.crypto.inputParameters,
      {},
      { shouldThrowError: false, overrides },
    )
    if (validator.error) return
    const from = (validator.overrideSymbol(NAME) as string).toUpperCase()
    const to = validator.validated.data.quote.toUpperCase()
    return `${from}${to}`
  }

  const getForexSymbol = (input: AdapterRequest) => {
    const validator = new Validator(
      input,
      endpoints.forex.inputParameters,
      {},
      { shouldThrowError: false, overrides },
    )
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
    } else if (isCrypto(input)) {
      return getCryptoSymbol(input)
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
        } else if (isCrypto(input)) {
          return {
            key: 'crypto',
            url: defaultConfig.cryptoWsEndpoint,
          }
        }
        return undefined
      },
      shouldNotServeInputUsingWS: (input) => !isForex(input) && !isStock(input) && !isCrypto(input),
      subscribe: (input) => getSubscription(getSymbol(input)),
      unsubscribe: (input) => getSubscription(getSymbol(input), false),
      subsFromMessage: (message: Message) => {
        if (message.s) return getSubscription(message.s.toUpperCase())
        return undefined
      },
      isError: (message: { status_code: number }) => {
        if (message['status_code']) {
          return message['status_code'] !== 200
        }
        return false
      },
      filter: (message: Message) => !!message.p || (!!message.a && !!message.b),
      toResponse: (message: Message) => {
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
