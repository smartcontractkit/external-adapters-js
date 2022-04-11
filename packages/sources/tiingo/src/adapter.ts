import { Builder, Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  AdapterRequest,
  APIEndpoint,
  Config,
  ExecuteFactory,
  ExecuteWithConfig,
  MakeWSHandler,
} from '@chainlink/types'
import { DEFAULT_WS_API_ENDPOINT, makeConfig } from './config'
import * as endpoints from './endpoint'
import overrides from './config/symbols.json'

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  return Builder.buildSelector(request, context, config, endpoints)
}

export const endpointSelector = (request: AdapterRequest): APIEndpoint =>
  Builder.selectEndpoint(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<Config> = (config) => {
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
  service: 'crypto_data' | 'iex'
  data: TopOfBookUpdateData | TradeUpdateData | SyntheticMessage
}

const customParams = {
  base: ['base', 'from', 'coin', 'ticker'],
}

export const makeWSHandler = (config?: Config): MakeWSHandler | undefined => {
  const getFxTicker = (input: AdapterRequest): string | undefined => {
    const validator = new Validator(input, customParams, {}, { shouldThrowError: false, overrides })
    if (validator.error) return
    return validator.validated.data.base.toLowerCase()
  }
  const isFx = (input: AdapterRequest): boolean =>
    endpoints.iex.supportedEndpoints.includes(input.data.endpoint)
  const getCryptoTicker = (input: AdapterRequest): string | undefined => {
    const validator = new Validator(
      input,
      endpoints.prices.inputParameters,
      {},
      { shouldThrowError: false, overrides },
    )
    if (validator.error) return
    const { base, quote } = validator.validated.data
    return `${base}/${quote}`.toLowerCase()
  }
  const isCrypto = (input: AdapterRequest): boolean =>
    endpoints.prices.supportedEndpoints.includes(input.data.endpoint)

  const getTicker = (input: AdapterRequest) => {
    if (isFx(input)) {
      return getFxTicker(input)
    } else if (isCrypto(input)) {
      return getCryptoTicker(input)
    }
    return undefined
  }

  const getWSUrl = (baseURL: string, input: AdapterRequest): string => {
    if (isFx(input)) {
      return `${baseURL}/iex`
    }
    return `${baseURL}/crypto-synth`
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
          getWSUrl(defaultConfig.api.baseWsURL || DEFAULT_WS_API_ENDPOINT, input),
      },
      shouldNotServeInputUsingWS: (input) => !isFx(input) && !isCrypto(input),
      subscribe: (input) => getSubscription(getTicker(input)),
      unsubscribe: (input) => getSubscription(getTicker(input), false),
      isError: (message: Message) => message.messageType === 'E',
      filter: (message: Message) => message.messageType === 'A',
      subsFromMessage: (message: UpdateMessage) =>
        message.data &&
        message.messageType === 'A' &&
        getSubscription(message.service === 'iex' ? message.data[3] : message.data[1]),
      toResponse: (message: UpdateMessage, input: AdapterRequest) => {
        let result
        if (isFx(input)) {
          result = Requester.validateResultNumber(message.data, [5])
        } else {
          // Crypto
          result = Requester.validateResultNumber(message.data, [4])
        }
        return Requester.success('1', { data: { result } }, true)
      },
      minTimeToNextMessageUpdateInS: 1,
    }
  }
}
