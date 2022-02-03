import { Builder, Validator, HTTP } from '@chainlink/ea-bootstrap'
import {
  Config,
  ExecuteWithConfig,
  ExecuteFactory,
  AdapterRequest,
  APIEndpoint,
  MakeWSHandler,
} from '@chainlink/types'
import { makeConfig } from './config'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  return Builder.buildSelector(request, context, config, endpoints)
}

export const endpointSelector = (request: AdapterRequest): APIEndpoint =>
  Builder.selectEndpoint(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

interface Message {
  topic: string
  ts: number
  data: {
    symbol: string
    ask: number
    askSize: number
    bid: number
    bidSize: number
  }
}
export const makeWSHandler = (config?: Config): MakeWSHandler => {
  const getSubscription = (symbol?: string, subscribe = true) => {
    if (!symbol) return
    return {
      event: subscribe ? 'subscribe' : 'unsubscribe',
      topic: `${symbol}@bbo`,
      id: 1,
    }
  }
  const getSymbol = (input: AdapterRequest) => {
    const validator = new Validator(
      input,
      endpoints.crypto.inputParameters,
      {},
      { shouldThrowError: false },
    )
    if (validator.error) return
    const symbol = validator.validated.data.base.toUpperCase()
    const convert = validator.validated.data.quote.toUpperCase()
    return `SPOT_${symbol}_${convert}`
  }
  return () => {
    const defaultConfig = config || makeConfig()
    return {
      connection: {
        url: defaultConfig.api.baseWsURL,
      },
      subscribe: (input) => getSubscription(getSymbol(input)),
      unsubscribe: (input) => getSubscription(getSymbol(input), false),
      subsFromMessage: (message) => {
        if (!message.data) return undefined
        return getSubscription(message.data.symbol)
      },
      isError: (message: { type?: string; success: boolean }) =>
        message.type === 'error' || message.success === false,
      // Ignore everything is not a ticker message. Throw an error on incoming errors.
      filter: (message: Message) => message.data !== undefined,
      toResponse: (message: Message) => {
        const ask = message.data.ask
        const bid = message.data.bid
        const price = (ask + bid) / 2 // average
        const result = HTTP.validateResultNumber({ price }, ['price'])
        return HTTP.success('1', { data: { result } })
      },
    }
  }
}
