import {
  AdapterRequest,
  AdapterResponse,
  APIEndpoint,
  ExecuteWithConfig,
  IncludePair,
  Includes,
  MakeWSHandler,
  ExecuteFactory,
  util,
} from '@chainlink/ea-bootstrap'
import { Builder, Requester, Validator } from '@chainlink/ea-bootstrap'
import { makeConfig, DEFAULT_WS_API_ENDPOINT, NAME, Config } from './config'
import * as endpoints from './endpoint'
import { inputParameters } from './endpoint/price'
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
  s: string
  i: string
  pch: number
  nch: number
  bid: number
  ask: number
  price: number
  dt: number
  state: string
  type: string
  dhigh: number
  dlow: number
  o: number
  prev: number
  topic: string
}

export const makeWSHandler = (
  config?: Config,
): MakeWSHandler<
  Message | any // TODO: full WS types
> => {
  // http://api.tradingeconomics.com/documentation/Streaming
  // https://github.com/boxhock/tradingeconomics-nodejs-stream/blob/master/src/index.ts
  const withApiKey = (url: string, key: string, secret: string) => `${url}?client=${key}:${secret}`
  const getSubscription = (to: string) => ({ topic: 'subscribe', to })

  const baseFromIncludes = includes.reduce(
    (basesMap: { [from: string]: string }, includesSet: Includes) => {
      const { includes } = includesSet
      for (const includePair of includes) {
        basesMap[includePair.from] = includesSet.from
      }
      return basesMap
    },
    {},
  )

  return () => {
    const defaultConfig = config || makeConfig()

    return {
      connection: {
        url: withApiKey(
          defaultConfig.ws?.baseWsURL || DEFAULT_WS_API_ENDPOINT,
          defaultConfig.client.key || '',
          defaultConfig.client.secret || '',
        ),
      },
      noHttp: true, // Turned on due to negotiated plans having limited HTTP credits
      subscribe: (input) => {
        const validator = new Validator(
          input,
          inputParameters,
          {},
          { shouldThrowError: false, overrides, includes },
        )
        if (validator.error) {
          return
        }

        const { from } = util.getPairOptions<IncludePair, endpoints.TInputParameters>( //TODO beware, this does not set base to uppercase like the previous version
          NAME,
          validator,
          (_, i: IncludePair) => i,
          (from: string, to: string) => ({ from, to }),
        )
        return getSubscription(from)
      },
      unsubscribe: () => undefined,
      subsFromMessage: (message: Message) => getSubscription(message?.s),
      isError: (message: Message) => Number(message.type) > 400 && Number(message.type) < 900,
      filter: (message: Message): boolean => !!message.topic && message.topic !== 'keepalive',
      toResponse: (wsResponse: Message): AdapterResponse => {
        const base = baseFromIncludes[wsResponse?.s] ?? wsResponse?.s
        const validator = new Validator<endpoints.TInputParameters>(
          { id: 'tradingeconomics-ws-to-repsonse', data: { base, quote: 'USD' } },
          inputParameters,
          {},
          { shouldThrowError: false, overrides, includes },
        )

        const { inverse } = util.getPairOptions<IncludePair, endpoints.TInputParameters>(
          NAME,
          validator,
          (_, i: IncludePair) => i,
          (from: string, to: string) => ({ from, to }),
        )

        const result = Requester.validateResultNumber(wsResponse, ['price'], { inverse })
        return Requester.success(undefined, { data: { result } })
      },
    }
  }
}
