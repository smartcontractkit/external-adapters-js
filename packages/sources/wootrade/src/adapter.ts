import { Builder, Validator, Requester } from '@chainlink/ea-bootstrap'
import {
  Config,
  ExecuteWithConfig,
  ExecuteFactory,
  AdapterRequest,
  APIEndpoint,
  MakeWSHandler,
} from '@chainlink/ea-bootstrap'
import { makeConfig } from './config'
import * as endpoints from './endpoint'

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

export const makeWSHandler = (config?: Config): MakeWSHandler<Message | any> => {
  const getSubscription = (symbol?: string, subscribe = true) => {
    if (!symbol) return undefined
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
        url: defaultConfig.ws?.baseWsURL,
      },
      subscribe: (input: AdapterRequest) => getSubscription(getSymbol(input)),
      unsubscribe: (input: AdapterRequest) => getSubscription(getSymbol(input), false),
      subsFromMessage: (message: Message) => {
        if (!message.data) return ''
        return getSubscription(message.data.symbol)
      },
      isError: (message: any) => message.type === 'error' || message.success === false,
      // Ignore everything is not a ticker message. Throw an error on incoming errors.
      filter: (message: Message) => message.data !== undefined,
      toResponse: (message: Message) => {
        const ask = message.data.ask
        const bid = message.data.bid
        const price = (ask + bid) / 2 // average
        const result = Requester.validateResultNumber({ price }, ['price'])
        return Requester.success('1', { data: { result } })
      },
    }
  }
}
