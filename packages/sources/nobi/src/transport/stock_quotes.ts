import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util/logger'
import { BaseEndpointTypes } from '../endpoint/stock_quotes'
import { customSubscriptionMessages, heartbeat } from './common'

const logger = makeLogger('NobiStockQuotesTransport')

export type WSResponse = {
  k: string // quote
  c: string // "ETF:US:SPY/USD"
  s: string // "SPY/USD"
  m: string // mid
  b: string // bid
  a: string // ask
  bv: string // bid volume
  av: string // ask volume
  lp: string // last traded price
  v: string // latest available index value -> only for k = "value"
  t: number // source timestamp (ms)
  message: string // error message
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WSResponse
  }
}

export const invalidPairs = new Set<string>()

export const buildQuoteTransport = () =>
  new WebSocketTransport<WsTransportTypes>({
    url: (context) => context.adapterSettings.QUOTES_API_ENDPOINT,
    options: (context) => ({
      headers: {
        'X-API-KEY': context.adapterSettings.QUOTES_API_KEY,
      },
    }),
    handlers: {
      heartbeat,
      message: (message) => {
        if (message.message && message.message.startsWith('pair not found: ')) {
          const pair = message.message.split('pair not found: ')[1] || ''
          const base = baseToUpperCase(pair.split('/')[0])
          const quote = pair.split('/')[1]?.toUpperCase()
          if (!base || !quote) {
            logger.warn(`Received invalid base or quote in error message: ${message.message}`)
            return
          }
          const response = {
            statusCode: 502,
            errorMessage: 'The requested pair does not exist, is inactive, or is suspended.',
          }

          invalidPairs.add(buildPair({ base, quote }))
          return [
            {
              params: { base, quote, requireVolume: true },
              response,
            },
            {
              params: { base, quote, requireVolume: false },
              response,
            },
          ]
        }

        if (!message.c || !message.k) {
          return
        }
        const base = baseToUpperCase(message.c.split('/')[0])
        const quote = message.c.split('/')[1]?.toUpperCase()
        if (!base || !quote) {
          logger.warn(`Received invalid base or quote in message: ${message.c}`)
          return
        }
        const params = { base, quote }

        if (message.k.toUpperCase() === 'VALUE') {
          return handleValueFrames(params, message)
        }
        if (message.k.toUpperCase() === 'QUOTE') {
          return handleQuoteFrames(params, message)
        }
        return
      },
    },
    builders: {
      customSubscriptionMessages: (_, subscriptions) =>
        customSubscriptionMessages(
          {
            ...subscriptions,
            desired: subscriptions.desired.filter((params) => !invalidPairs.has(buildPair(params))),
            stale: subscriptions.stale.filter((params) => !invalidPairs.has(buildPair(params))),
          },
          buildPair,
          'subscribe_market_data',
          'unsubscribe_market_data',
        ),
    },
  })

export const buildPair = (params: { base: string; quote: string }) =>
  `${baseToUpperCase(params.base)}/${params.quote.toUpperCase()}`

// "Index:kr:kospi200" -> "Index:KR:KOSPI200"
export const baseToUpperCase = (base?: string) => base?.replace(/:.*/, (s) => s.toUpperCase()) || ''

const handleValueFrames = (params: { base: string; quote: string }, message: WSResponse) => {
  const value = getPrice(message.v)
  if (value === null) {
    logger.warn(`Received invalid v in message: ${JSON.stringify(message)}`)
    return
  }

  invalidPairs.delete(buildPair(params))
  return [
    {
      params: { ...params, requireVolume: true },
      response: {
        statusCode: 502,
        errorMessage: `${message.c} does not support bid/ask volume`,
      },
    },
    {
      params: { ...params, requireVolume: false },
      response: {
        result: value,
        data: {
          mid_price: value,
          bid_price: value,
          bid_volume: null,
          ask_price: value,
          ask_volume: null,
          last_price: value,
        },
        ...getProviderIndicatedTimeUnixMs(message.t),
      },
    },
  ]
}

const handleQuoteFrames = (params: { base: string; quote: string }, message: WSResponse) => {
  const midPrice = getPrice(message.m)
  const lastTradedPrice = getPrice(message.lp)
  if (midPrice === null || lastTradedPrice === null) {
    logger.warn(`Received invalid m/lp in message: ${JSON.stringify(message)}`)
    return
  }

  const bidPrice = getPrice(message.b) ?? midPrice
  const askPrice = getPrice(message.a) ?? midPrice

  if (bidPrice > midPrice || askPrice < midPrice) {
    logger.warn(`Received invalid bid/ask prices in message: ${JSON.stringify(message)}`)
    return
  }

  const bidVolume = getNumber(message.bv)
  const askVolume = getNumber(message.av)

  const response = {
    result: lastTradedPrice,
    data: {
      mid_price: midPrice,
      bid_price: bidPrice,
      bid_volume: bidVolume,
      ask_price: askPrice,
      last_price: lastTradedPrice,
      ask_volume: askVolume,
    },
    ...getProviderIndicatedTimeUnixMs(message.t),
  }

  invalidPairs.delete(buildPair(params))
  return [
    {
      params: { ...params, requireVolume: true },
      response:
        bidVolume === null || askVolume === null
          ? {
              statusCode: 502,
              errorMessage: `Bid volume: ${message.bv} or Ask volume: ${message.av} for ${message.c} is invalid.`,
            }
          : response,
    },
    {
      params: { ...params, requireVolume: false },
      response,
    },
  ]
}

const getProviderIndicatedTimeUnixMs = (time: number) => {
  if (isFinite(time)) {
    const date = new Date(time)
    if (2000 < date.getUTCFullYear() && date.getUTCFullYear() < 2100) {
      return {
        timestamps: {
          providerIndicatedTimeUnixMs: date.getTime(),
        },
      }
    }
  }
  return null
}

const getPrice = (value: unknown) => {
  const price = getNumber(value) ?? 0
  return price > 0 ? price : null
}

const getNumber = (value: unknown) => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null
  }
  if (value.toString().trim().length === 0) {
    return null
  }

  const number = Number(value)
  if (isFinite(number) && number >= 0) {
    return number
  }

  return null
}
