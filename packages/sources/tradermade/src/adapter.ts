import {
  Config,
  ExecuteWithConfig,
  MakeWSHandler,
  AdapterRequest,
  ExecuteFactory,
  APIEndpoint,
} from '@chainlink/ea-bootstrap'
import { Requester, Validator, Builder } from '@chainlink/ea-bootstrap'
import { makeConfig, DEFAULT_WS_API_ENDPOINT } from './config'
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

// interface Message {
//   symbol: string
//   ts: string
//   bid: number
//   ask: number
//   mid: number
// }

export const makeWSHandler = (config?: Config): MakeWSHandler | undefined => {
  const getSubscription = (pair?: string) => {
    const defaultConfig = config || makeConfig()
    if (!pair) return ''
    const sub = {
      userKey: defaultConfig.wsApiKey,
      symbol: pair,
    }
    return sub
  }
  const getPair = (input: AdapterRequest) => {
    const validator = new Validator(
      input,
      endpoints.forex.inputParameters,
      {},
      { shouldThrowError: false, overrides },
    )
    if (validator.error) return
    const base = validator.validated.data.base.toUpperCase()
    const quote = validator.validated.data.quote.toUpperCase()
    return `${base}${quote}`
  }
  return () => {
    const defaultConfig = config || makeConfig()
    return {
      connection: {
        url: defaultConfig.ws?.baseWsURL || DEFAULT_WS_API_ENDPOINT,
      },
      shouldNotServeInputUsingWS: (input: any) =>
        endpoints.forex.supportedEndpoints.indexOf(input.data.endpoint) === -1,
      subscribe: (input: any) => getSubscription(getPair(input)),
      unsubscribe: () => undefined, // Tradermade does not support unsubscribing.
      subsFromMessage: (message: any) => {
        if (!message.symbol) return ''
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
