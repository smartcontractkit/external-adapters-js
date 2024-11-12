import { Requester, Validator, Builder } from '@chainlink/ea-bootstrap'
import {
  Config,
  ExecuteWithConfig,
  ExecuteFactory,
  MakeWSHandler,
  AdapterRequest,
  APIEndpoint,
} from '@chainlink/ea-bootstrap'
import { makeConfig, DEFAULT_WS_API_ENDPOINT } from './config'
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
  e: string
  E: number
  s: string
  c: string
  o: string
  h: string
  l: string
  v: string
  q: string
  type?: string
}

export const makeWSHandler = (
  config?: Config,
): MakeWSHandler<
  Message | any
  // TODO :WS message types
> => {
  const getSubscription = (symbol?: string, subscribe = true) => {
    if (!symbol) return ''
    return {
      method: subscribe ? 'SUBSCRIBE' : 'UNSUBSCRIBE',
      params: [`${symbol}@miniTicker`],
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
    return `${symbol.toLowerCase()}${convert.toLowerCase()}`
  }
  return () => {
    const defaultConfig = config || makeConfig()
    return {
      connection: {
        url: defaultConfig.ws?.baseWsURL || DEFAULT_WS_API_ENDPOINT,
      },
      subscribe: (input) => getSubscription(getSymbol(input)),
      unsubscribe: (input) => getSubscription(getSymbol(input), false),
      subsFromMessage: (message: Message) => {
        if (!message.s) return ''
        return getSubscription(`${message.s.toLowerCase()}`)
      },
      isError: (message: Message) => message.type === 'error',
      // Ignore everything is not a ticker message. Throw an error on incoming errors.
      filter: (message: Message) => message.e === '24hrMiniTicker',
      toResponse: (message: Message) => {
        const result = Requester.validateResultNumber(message, ['c'])
        return Requester.success('1', { data: { result } })
      },
    }
  }
}
