import { Builder, InputParameters, Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  AdapterRequest,
  APIEndpoint,
  Config,
  ExecuteFactory,
  ExecuteWithConfig,
  MakeWSHandler,
} from '@chainlink/ea-bootstrap'
import { DEFAULT_WS_API_ENDPOINT, makeConfig } from './config'
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

type MessageType =
  | 'A' // for new data
  | 'U' // for updating existing data
  | 'D' // for deleing existing data
  | 'I' // for informational/meta data
  | 'E' // for error messages
  | 'H' // for Heartbeats (can be ignored for most cases)
interface Message {
  service: string
  response: { message: string; code: number }
  messageType: MessageType
}
interface TopOfBookUpdateData {
  0: 'Q'
  1: string // Ticker related to the asset.
  2: string // A string representing the datetime this trade quote came in.
  3: string // The exchange the top-of-book update is for.
  4: number // The amount of crypto at the bid price in the base currency.
  5: number // The current highest bid price.
  6: number // The mid price of the current timestamp when both "bidPrice" and "askPrice" are not-null. In mathematical terms: mid = (bidPrice + askPrice)/2.0
  7: number // The amount of crypto at the ask price in the base currency.
  8: number // The current lowest ask price.
}
interface TradeUpdateData {
  0: 'T'
  1: string // Ticker related to the asset.
  2: string // A string representing the datetime this trade quote came in.
  3: string // The exchange the trade was done one.
  4: number // The amount of crypto volume done at the last price in the base currency.
  5: number // The last price the last trade was executed at.
}
interface SyntheticMessage {
  0: 'SA'
  1: string // Ticker
  2: string // A string representing the datetime this trade quote came in.
  3: string // The exchange the trade was done one.
  4: number // The last price the last trade was executed at.
}
interface UpdateMessage extends Message {
  messageType: 'A'
  service: 'crypto_data' | 'fx' | 'iex'
  data: TopOfBookUpdateData | TradeUpdateData | SyntheticMessage
}

type EndpointGetters = {
  [endpoint: string]: {
    resultIndex: number
    getTicker: (input: AdapterRequest) => string | undefined
    tickerIndex: 1 | 3
    wsUrl: string
  }
}

export type TInputParameters = { base: string }
export const customParams: InputParameters<TInputParameters> = {
  base: {
    aliases: ['from', 'coin', 'ticker'],
    required: true,
    description: 'The symbol of the currency to query',
  },
}

export const makeWSHandler = (config?: Config): MakeWSHandler<any> => {
  // TODO: WS message types
  const getBaseTicker = (input: AdapterRequest): string | undefined => {
    const validator = new Validator(input, customParams, {}, { shouldThrowError: false, overrides })
    if (validator.error) return
    return validator.validated.data.base.toLowerCase()
  }

  const getBaseQuoteTicker = (input: AdapterRequest, slash = true): string | undefined => {
    const validator = new Validator(
      input,
      endpoints.prices.inputParameters,
      {},
      { shouldThrowError: false, overrides },
    )
    if (validator.error) return
    const { base, quote } = validator.validated.data
    return `${base}${slash ? '/' : ''}${quote}`.toLowerCase()
  }

  const getEndpointRoute = (input: AdapterRequest): string | undefined => {
    for (const endpoint in endpoints) {
      //@ts-expect-error "endpoints" guaranteed to include "endpoint" as a key
      if (endpoints[endpoint].supportedEndpoints.includes(input.data.endpoint)) return endpoint
    }
    return undefined
  }

  const serviceToEndpoint = {
    crypto_data: 'prices',
    fx: 'forex',
    iex: 'iex',
  }

  const wsEndpointGetters: EndpointGetters = {
    forex: {
      resultIndex: 5,
      getTicker: (input) => getBaseQuoteTicker(input, false),
      tickerIndex: 1,
      wsUrl: 'fx',
    },
    iex: {
      resultIndex: 5,
      getTicker: getBaseTicker,
      tickerIndex: 3,
      wsUrl: 'iex',
    },
    prices: {
      resultIndex: 4,
      getTicker: getBaseQuoteTicker,
      tickerIndex: 1,
      wsUrl: 'crypto-synth',
    },
  }

  const getTicker = (input: AdapterRequest) => {
    const route = getEndpointRoute(input)
    return wsEndpointGetters[route ?? 'prices'].getTicker(input)
  }

  const getWSUrl = (baseURL: string, input: AdapterRequest): string => {
    const route = getEndpointRoute(input)
    const suffix = wsEndpointGetters[route ?? 'prices'].wsUrl
    return `${baseURL}/${suffix}`
  }

  return () => {
    const defaultConfig = config || makeConfig()

    const getSubscription = (ticker: string | undefined, subscribe = true) => {
      if (!ticker) return
      return {
        eventName: subscribe ? 'subscribe' : 'unsubscribe',
        authorization: defaultConfig?.apiKey,
        eventData: {
          thresholdLevel: ticker.includes('/') ? 6 : 5, // Crypto is the only ticker type that uses "/", and should use level 6 for synthetic updates
          tickers: [ticker],
        },
      }
    }

    return {
      connection: {
        getUrl: async (input) =>
          getWSUrl(defaultConfig.ws?.baseWsURL || DEFAULT_WS_API_ENDPOINT, input),
      },
      shouldNotServeInputUsingWS: (input) => {
        const route = getEndpointRoute(input)
        return !route || !(route in wsEndpointGetters)
      },
      subscribe: (input) => getSubscription(getTicker(input)),
      unsubscribe: (input) => getSubscription(getTicker(input), false),
      isError: (message: Message) => message.messageType === 'E',
      filter: (message: Message) => message.messageType === 'A',
      subsFromMessage: (message: UpdateMessage) => {
        return (
          message.data &&
          message.messageType === 'A' &&
          getSubscription(
            message.data[wsEndpointGetters[serviceToEndpoint[message.service]].tickerIndex],
          )
        )
      },
      toResponse: (message: UpdateMessage, input: AdapterRequest) => {
        const route = getEndpointRoute(input)
        const resultIndex = wsEndpointGetters[route ?? 'prices'].resultIndex
        const result = Requester.validateResultNumber(message.data, [resultIndex])
        return Requester.success('1', { data: { result } }, true)
      },
      minTimeToNextMessageUpdateInS: 1,
    }
  }
}
