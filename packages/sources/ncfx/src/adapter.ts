import { Requester, Validator, Builder } from '@chainlink/ea-bootstrap'
import {
  Config,
  ExecuteWithConfig,
  ExecuteFactory,
  MakeWSHandler,
  AdapterRequest,
  APIEndpoint,
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

// interface Message {
//   timestamp: string
//   ccy?: string
//   type?: string
//   tenor?: string
//   rate?: string
//   currencyPair?: string
//   bid?: number
//   offer?: number
//   mid?: number
// }

export const makeWSHandler = (config?: Config): MakeWSHandler => {
  const getPair = (input: AdapterRequest) => {
    const validator = new Validator(
      input,
      endpoints.crypto.inputParameters,
      {},
      { shouldThrowError: false },
    )
    if (validator.error) return ''
    const base = validator.validated.data.base.toUpperCase()
    const quote = validator.validated.data.quote.toUpperCase()
    const endpoint = input.data.endpoint
    return !!endpoint && endpoints.forex.supportedEndpoints.indexOf(endpoint) !== -1
      ? `${base}${quote}`
      : `${base}/${quote}`
  }
  const getSubscription = (request: 'subscribe' | 'unsubscribe', pair?: string) => {
    if (!pair) return ''
    return { request, ccy: pair }
  }

  const isForexEndpoint = (endpoint: string | undefined) =>
    !!endpoint && endpoints.forex.supportedEndpoints.indexOf(endpoint) !== -1
  const getPairFieldFromNCFXResponse = (endpoint: string | undefined) =>
    isForexEndpoint(endpoint) ? 'ccy' : 'currencyPair'

  return () => {
    const defaultConfig = config || makeConfig()
    return {
      connection: {
        getUrl: async (input: any) => {
          const endpoint = input.data.endpoint
          if (isForexEndpoint(endpoint)) {
            return `${defaultConfig.adapterSpecificParams?.forexDefaultBaseWSUrl}/spotdata`
          }
          return `${defaultConfig.ws?.baseWsURL}/cryptodata`
        },
      },
      noHttp: true,
      subscribe: (input) => getSubscription('subscribe', getPair(input)),
      unsubscribe: (input) => getSubscription('unsubscribe', getPair(input)),
      subsFromMessage: (message: any, subscriptionMsg: any, input) => {
        if (Array.isArray(message) && message.length > 0) {
          const pairField = getPairFieldFromNCFXResponse(input.data.endpoint)
          const pairMessage = message.find((m) => m[pairField] === subscriptionMsg.ccy)
          if (!pairMessage) return ''
          return getSubscription('subscribe', `${pairMessage.currencyPair || pairMessage.ccy}`)
        }
        return getSubscription('subscribe', `${message}`)
      },
      isError: (message: any) => Number(message.TYPE) > 400 && Number(message.TYPE) < 900,
      filter: (message: any) => {
        return Array.isArray(message) && message.length > 0
      },
      toResponse: (message: any, input: any) => {
        const pair = getPair(input)
        const pairMessage = message.find(
          (m: any) => m[getPairFieldFromNCFXResponse(input.data.endpoint)] === pair,
        )
        if (!pairMessage) {
          throw new Error(`${pair} not found in message`)
        }
        const endpoint = input.data.endpoint
        const resultField = isForexEndpoint(endpoint) ? 'rate' : 'mid'
        const result = Requester.validateResultNumber(pairMessage, [resultField])
        return Requester.success('1', { data: { ...pairMessage, result } }, defaultConfig.verbose)
      },
      onConnect: (input: any) => {
        const endpoint = input.data.endpoint
        const username = isForexEndpoint(endpoint)
          ? (defaultConfig.adapterSpecificParams?.forexWSUsername as string)
          : (defaultConfig.api?.auth?.username as string)
        const password = isForexEndpoint(endpoint)
          ? (defaultConfig.adapterSpecificParams?.forexWSPassword as string)
          : (defaultConfig.api?.auth?.password as string)
        return {
          request: 'login',
          username,
          password,
        }
      },
    }
  }
}
