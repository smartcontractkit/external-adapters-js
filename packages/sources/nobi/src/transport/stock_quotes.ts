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
  t: string // source timestamp (ms)
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
          logger.warn(`Blocking pair ${base}/${quote} until EA restart.`)

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
  if (isNaN(value)) {
    logger.warn(`Received invalid v in message: ${JSON.stringify(message)}`)
    return
  }

  const timestamps = getProviderIndicatedTimeUnixMs(message.t)
  if (message.t != null && timestamps === null) {
    logger.warn(`Received invalid t in message: ${JSON.stringify(message)}`)
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
          bid_volume: NaN,
          ask_price: value,
          ask_volume: NaN,
          last_price: value,
        },
        ...timestamps,
      },
    },
  ]
}

const handleQuoteFrames = (params: { base: string; quote: string }, message: WSResponse) => {
  const providerMid = getOptionalPrice(message.m)
  const providerBid = getOptionalPrice(message.b)
  const providerAsk = getOptionalPrice(message.a)
  const lastTradedPrice = getPrice(message.lp)
  if (
    isNaN(providerMid ?? 0) ||
    isNaN(providerBid ?? 0) ||
    isNaN(providerAsk ?? 0) ||
    isNaN(lastTradedPrice)
  ) {
    logger.warn(`Received invalid m/b/a/lp in message: ${JSON.stringify(message)}`)
    return
  }

  // Use the provider mid when present, otherwise compute it from two valid sides, never from one
  const midPrice =
    providerMid ??
    (providerBid !== null && providerAsk !== null ? (providerBid + providerAsk) / 2 : null)
  if (midPrice === null) {
    logger.warn(`Received no m and no bid/ask pair in message: ${JSON.stringify(message)}`)
    return
  }

  // Spec: fall back to mid when b/a is missing
  const bidPrice = providerBid ?? midPrice
  const askPrice = providerAsk ?? midPrice

  if (bidPrice > midPrice || askPrice < midPrice) {
    logger.warn(`Received invalid bid/ask prices in message: ${JSON.stringify(message)}`)
    return
  }

  const timestamps = getProviderIndicatedTimeUnixMs(message.t)
  if (message.t != null && timestamps === null) {
    logger.warn(`Received invalid t in message: ${JSON.stringify(message)}`)
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
    ...timestamps,
  }

  invalidPairs.delete(buildPair(params))
  return [
    {
      params: { ...params, requireVolume: false },
      response,
    },
  ].concat(
    isNaN(bidVolume) || isNaN(askVolume)
      ? []
      : [
          {
            params: { ...params, requireVolume: true },
            response,
          },
        ],
  )
}

// Returns null for both missing and invalid time
const getProviderIndicatedTimeUnixMs = (time: unknown) => {
  const ms = getNumber(time)
  if (!isNaN(ms)) {
    const date = new Date(ms)
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

const isMissing = (value: unknown) =>
  value == null || (typeof value === 'string' && value.trim().length === 0)

// null = missing, NaN = present but invalid
const getOptionalPrice = (value: unknown) => (isMissing(value) ? null : getPrice(value))

const getPrice = (value: unknown) => {
  const price = getNumber(value)
  return price > 0 ? price : NaN
}

// Plain decimal with an optional exponent. Rejects hex, binary, octal, a leading '+',
// thousands separators and surrounding text, all of which Number() would otherwise accept or coerce.
const NUMBER_FORMAT = /^-?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/

const getNumber = (value: unknown) => {
  let number: number
  if (typeof value === 'number') {
    number = value
  } else if (typeof value === 'string' && NUMBER_FORMAT.test(value.trim())) {
    number = Number(value)
  } else {
    return NaN
  }

  if (isFinite(number) && number >= 0) {
    return number
  }

  return NaN
}
