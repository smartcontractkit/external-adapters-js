import {
  AdapterRequest,
  APIEndpoint,
  ExecuteFactory,
  ExecuteWithConfig,
  Logger,
  MakeWSHandler,
} from '@chainlink/ea-bootstrap'
import { Builder, Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, makeConfig, NAME } from './config'
import * as endpoints from './endpoint'
import overrides from './config/symbols.json'

export const execute: ExecuteWithConfig<Config, endpoints.TInputParameters> = async (
  request,
  context,
  config,
) => {
  return Builder.buildSelector<Config, endpoints.TInputParameters>(
    request,
    context,
    config,
    endpoints,
  )
}

export const endpointSelector = (
  request: AdapterRequest,
): APIEndpoint<Config, endpoints.TInputParameters> =>
  Builder.selectEndpoint<Config, endpoints.TInputParameters>(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<Config, endpoints.TInputParameters> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

interface Message {
  p: string
  a: string
  b: string
  s: string
}

const etfEndpoints = [...endpoints.etf.supportedEndpoints, ...endpoints.ukEtf.supportedEndpoints]

export const makeWSHandler = (config?: Config): MakeWSHandler<Message | any> =>
  // TODO : WS message types
  {
    const getSubscription = (symbols?: string, subscribe = true) => {
      if (!symbols) return ''
      return {
        action: subscribe ? 'subscribe' : 'unsubscribe',
        symbols,
      }
    }
    const isEtf = (input: AdapterRequest): boolean =>
      !!input.data.endpoint && etfEndpoints.includes(input?.data?.endpoint)

    const isStock = (input: AdapterRequest): boolean =>
      !!input.data.endpoint && endpoints.stock.supportedEndpoints.includes(input.data.endpoint)

    const isCrypto = (input: AdapterRequest): boolean =>
      !!input.data.endpoint && endpoints.crypto.supportedEndpoints.includes(input.data.endpoint)

    const isForex = (input: AdapterRequest): boolean =>
      !!input.data.endpoint && endpoints.forex.supportedEndpoints.includes(input.data.endpoint)

    const getEtfSymbol = (input: AdapterRequest) => {
      const validator = new Validator(
        input,
        endpoints.etf.inputParameters,
        {},
        { shouldThrowError: false, overrides },
      )
      if (validator.error) return
      if (Array.isArray(validator.validated.data.base)) {
        Logger.debug(
          `[WS]: ${validator.validated.data.base} supplied as base. Only non-array tickers can be used for WS`,
        )
        return
      }

      return validator.overrideSymbol(NAME, validator.validated.data.base).toUpperCase()
    }

    const getStockSymbol = (input: AdapterRequest) => {
      const validator = new Validator(
        input,
        endpoints.stock.inputParameters,
        {},
        { shouldThrowError: false, overrides },
      )
      if (validator.error) return
      if (Array.isArray(validator.validated.data.base)) {
        Logger.debug(
          `[WS]: ${validator.validated.data.base} supplied as base. Only non-array tickers can be used for WS`,
        )
        return
      }
      return validator.validated.data.base.toUpperCase()
    }

    const getCryptoSymbol = (input: AdapterRequest) => {
      const validator = new Validator(
        input,
        endpoints.crypto.inputParameters,
        {},
        { shouldThrowError: false, overrides },
      )
      if (validator.error) return
      const from = validator.overrideSymbol(NAME, validator.validated.data.base).toUpperCase()
      const to = validator.overrideSymbol(NAME, validator.validated.data.quote).toUpperCase()
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
      const from = validator.overrideSymbol(NAME, validator.validated.data.base).toUpperCase()
      const to = validator.overrideSymbol(NAME, validator.validated.data.quote).toUpperCase()
      return `${from}/${to}` // Note that this adds the "/", whereas the REST endpoint doesn't use this
    }

    const getSymbol = (input: AdapterRequest): string | undefined => {
      if (isStock(input)) {
        return getStockSymbol(input)
      } else if (isForex(input)) {
        return getForexSymbol(input)
      } else if (isCrypto(input)) {
        return getCryptoSymbol(input)
      } else if (isEtf(input)) {
        return getEtfSymbol(input)
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
          } else if (isEtf(input)) {
            return {
              key: 'etf',
              url: defaultConfig.etfWsEndpoint,
            }
          }
          return undefined
        },
        shouldNotServeInputUsingWS: (input) =>
          !isForex(input) && !isStock(input) && !isCrypto(input) && !isEtf(input),
        subscribe: (input) => getSubscription(getSymbol(input)),
        unsubscribe: (input) => getSubscription(getSymbol(input), false),
        subsFromMessage: (message: Message) => {
          if (message.s) return getSubscription(message.s.toUpperCase())
          return ''
        },
        isError: (message: any) => {
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
