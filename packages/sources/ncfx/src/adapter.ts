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

interface CryptoMessage {
  timestamp: string
  ccy?: string
  type?: string
  tenor?: string
  rate?: string
  currencyPair?: string
  bid?: number
  offer?: number
  mid?: number
}

interface ForexMessage {
  [pair: string]: { price: number; timestamp: string }
}

type Message = CryptoMessage | ForexMessage

export const makeWSHandler = (
  config?: Config,
): MakeWSHandler<
  Message | any // TODO: WS message types
> => {
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

  return () => {
    const defaultConfig = config || makeConfig()
    return {
      connection: {
        getUrl: async (input: any) => {
          const endpoint = input.data.endpoint
          if (isForexEndpoint(endpoint)) {
            return `${defaultConfig.adapterSpecificParams?.forexDefaultBaseWSUrl}`
          }
          return `${defaultConfig.ws?.baseWsURL}/cryptodata`
        },
        protocol: {
          headers: {
            ...defaultConfig.api?.headers,
            ncfxauth: defaultConfig.adapterSpecificParams?.forexEncodedCreds,
          },
        },
      },
      noHttp: true,
      subscribe: (input: AdapterRequest) =>
        isForexEndpoint(input.data.endpoint)
          ? 'ncfx_forex'
          : getSubscription('subscribe', getPair(input)),
      unsubscribe: (input: AdapterRequest) =>
        isForexEndpoint(input.data.endpoint) ? '' : getSubscription('unsubscribe', getPair(input)),
      subsFromMessage: (message: Message, subscriptionMsg: any, input: AdapterRequest) => {
        if (isForexEndpoint(input.data.endpoint)) return 'ncfx_forex'
        if (Array.isArray(message) && message.length > 0) {
          const pairMessage = message.find((m) => m.currencyPair === subscriptionMsg.ccy)
          if (!pairMessage) return ''
          return getSubscription('subscribe', `${pairMessage.currencyPair || pairMessage.ccy}`)
        }

        return getSubscription('subscribe', `${message}`)
      },
      isError: (message: Message) => Number(message.type) > 400 && Number(message.type) < 900,
      filter: (message: Message) =>
        (Array.isArray(message) && message.length > 0) || Object.keys(message).length > 0,
      toResponse: (message: any, input: any) => {
        const pair = getPair(input)
        const pairMessage = Array.isArray(message)
          ? message.find((m: Message) => m.currencyPair === pair)
          : message[pair]

        if (!pairMessage) {
          throw new Error(`${pair} not found in message`)
        }
        const endpoint = input.data.endpoint
        const resultField = isForexEndpoint(endpoint) ? 'price' : 'mid'
        const result = Requester.validateResultNumber(pairMessage, [resultField])
        return Requester.success('1', { data: { ...pairMessage, result } }, defaultConfig.verbose)
      },
      onConnect: (input: AdapterRequest) => {
        const endpoint = input.data.endpoint
        if (isForexEndpoint(endpoint)) return ''
        return {
          request: 'login',
          username: defaultConfig.api?.auth?.username,
          password: defaultConfig.api?.auth?.password,
        }
      },
    } as any // TODO: connection type mismatch
  }
}
