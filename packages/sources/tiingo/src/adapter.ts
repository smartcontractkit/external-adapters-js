import { Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  AdapterRequest,
  Config,
  ExecuteFactory,
  ExecuteWithConfig,
  MakeWSHandler,
} from '@chainlink/types'
import { DEFAULT_ENDPOINT, DEFAULT_WS_API_ENDPOINT, makeConfig } from './config'
import { eod, iex, prices, top } from './endpoint'

const inputParams = {
  endpoint: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT

  switch (endpoint.toLowerCase()) {
    case eod.NAME:
      return await eod.execute(request, config)

    case iex.NAME:
    case 'stock':
      return await iex.execute(request, config)

    case top.NAME:
      return await top.execute(request, config)

    case prices.NAME:
    case 'crypto':
    default:
      return await prices.execute(request, config)
  }
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
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
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

export const makeWSHandler = (config?: Config): MakeWSHandler => {
  const getSubscription = (pair: string | undefined, subscribe = true) => {
    const defaultConfig = config || makeConfig()
    if (!pair) return
    return {
      eventName: subscribe ? 'subscribe' : 'unsubscribe',
      authorization: defaultConfig?.apiKey,
      eventData: {
        thresholdLevel: 5, // only Last Trade updates
        tickers: [pair],
      },
    }
  }
  const getPair = (input: AdapterRequest) => {
    const validator = new Validator(input, customParams, {}, false)
    if (validator.error) return
    const base = validator.validated.data.base.toLowerCase()
    const quote = validator.validated.data.quote.toLowerCase()
    return `${base}${quote}`
  }
  return () => {
    const defaultConfig = config || makeConfig()
    return {
      connection: {
        url: defaultConfig.api.baseWsURL || DEFAULT_WS_API_ENDPOINT,
      },
      subscribe: (input) => getSubscription(getPair(input)),
      unsubscribe: (input) => getSubscription(getPair(input), false),
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
