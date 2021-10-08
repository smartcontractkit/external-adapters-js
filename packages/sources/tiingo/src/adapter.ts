import { Requester, Validator, Builder } from '@chainlink/ea-bootstrap'
import {
  AdapterRequest,
  Config,
  ExecuteFactory,
  ExecuteWithConfig,
  MakeWSHandler,
  APIEndpoint,
} from '@chainlink/types'
import { DEFAULT_WS_API_ENDPOINT, makeConfig } from './config'
import * as endpoints from './endpoint'

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
interface UpdateMessage extends Message {
  messageType: 'A'
  service: 'crypto_data'
  data: TopOfBookUpdateData | TradeUpdateData
}

const customParams = {
  base: ['base', 'from', 'coin', 'ticker'],
}

export const makeWSHandler = (config?: Config): MakeWSHandler | undefined => {
  const getSubscription = (ticker: string | undefined, subscribe = true) => {
    const defaultConfig = config || makeConfig()
    if (!ticker) return
    return {
      eventName: subscribe ? 'subscribe' : 'unsubscribe',
      authorization: defaultConfig?.apiKey,
      eventData: {
        thresholdLevel: 5, // only Last Trade updates
        tickers: [ticker],
      },
    }
  }
  const getTicker = (input: AdapterRequest): string | undefined => {
    const validator = new Validator(input, customParams, {}, false)
    if (validator.error) return
    const base = validator.validated.data.base.toLowerCase()
    return base
  }
  return () => {
    const defaultConfig = config || makeConfig()
    return {
      connection: {
        url: defaultConfig.api.baseWsURL || DEFAULT_WS_API_ENDPOINT,
      },
      shouldNotServeInputUsingWS: (input) =>
        endpoints.iex.supportedEndpoints.indexOf(input.data.endpoint) === -1,
      subscribe: (input) => getSubscription(getTicker(input)),
      unsubscribe: (input) => getSubscription(getTicker(input), false),
      isError: (message: Message) => message.messageType === 'E',
      filter: (message: Message) => message.messageType === 'A',
      subsFromMessage: (message: UpdateMessage) => message.data && getSubscription(message.data[1]),
      toResponse: (message: UpdateMessage) => {
        const result = Requester.validateResultNumber(message.data, [5])
        return Requester.success('1', { data: { result } }, true)
      },
    }
  }
}
