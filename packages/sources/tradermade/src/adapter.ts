import {
  Config,
  ExecuteWithConfig,
  MakeWSHandler,
  AdapterRequest,
  ExecuteFactory,
  APIEndpoint,
  util,
  IncludePair,
} from '@chainlink/ea-bootstrap'
import { Requester, Validator, Builder } from '@chainlink/ea-bootstrap'
import { makeConfig, DEFAULT_WS_API_ENDPOINT, NAME } from './config'
import * as endpoints from './endpoint'
import overrides from './config/symbols.json'
import includes from './config/includes.json'

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
  symbol: string
  ts: string
  bid: number
  ask: number
  mid: number
}

export const makeWSHandler = (
  config?: Config,
): MakeWSHandler<
  Message | any // TODO: full WS message types
> => {
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
      { shouldThrowError: false, includes, overrides },
    )
    if (validator.error) return { pair: '', inverse: false }

    const { from, to, inverse } = util.getPairOptions<IncludePair, endpoints.TInputParameters>(
      NAME,
      validator,
      (_, i: IncludePair) => i,
      (from: string, to: string) => ({ from, to }),
    )

    return {
      pair: `${from.toUpperCase()}${to.toUpperCase()}`,
      inverse,
    }
  }
  return () => {
    const defaultConfig = config || makeConfig()
    return {
      connection: {
        url: defaultConfig.ws?.baseWsURL || DEFAULT_WS_API_ENDPOINT,
      },
      shouldNotServeInputUsingWS: (input: AdapterRequest) => {
        if (!input.data.endpoint) return true
        return endpoints.forex.supportedEndpoints.indexOf(input.data.endpoint) === -1
      },
      subscribe: (input: AdapterRequest) => getSubscription(getPair(input).pair),
      unsubscribe: () => undefined, // Tradermade does not support unsubscribing.
      subsFromMessage: (message: Message) => {
        if (!message.symbol) return ''
        return getSubscription(message.symbol)
      },
      isError: () => false, // No error
      filter: (message: Message) => !!message.mid,
      toResponse: (message: Message, input: AdapterRequest) => {
        const { inverse } = getPair(input)
        const result = Requester.validateResultNumber(message, ['mid'], { inverse })
        return Requester.success('1', { data: { result } })
      },
    }
  }
}
