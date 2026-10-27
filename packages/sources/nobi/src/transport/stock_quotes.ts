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
          const base = pair.split('/')[0]
          const quote = pair.split('/')[1]
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
        const base = message.c.split('/')[0]
        const quote = message.c.split('/')[1]
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
          },
          buildPair,
          'subscribe_market_data',
          'unsubscribe_market_data',
        ),
    },
  })

export const buildPair = (params: { base: string; quote: string }) =>
  `${params.base}/${params.quote}`

const handleValueFrames = (params: { base: string; quote: string }, message: WSResponse) => {
  if (!message.v || isNaN(Number(message.v))) {
    logger.warn(`Received non-numeric v in message: ${JSON.stringify(message)}`)
    return
  }
  const value = Number(message.v)

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
          bid_volume: undefined,
          ask_price: value,
          ask_volume: undefined,
          last_price: value,
        },
        timestamps: {
          providerIndicatedTimeUnixMs: new Date(message.t).getTime(),
        },
      },
    },
  ]
}

const handleQuoteFrames = (params: { base: string; quote: string }, message: WSResponse) => {
  if (!message.m || isNaN(Number(message.m)) || !message.lp || isNaN(Number(message.lp))) {
    logger.warn(`Received non-numeric m/lp in message: ${JSON.stringify(message)}`)
    return
  }

  const m = Number(message.m)

  const response = {
    result: Number(message.lp),
    data: {
      mid_price: m,
      bid_price: !message.b || isNaN(Number(message.b)) ? m : Number(message.b),
      bid_volume: Number(message.bv),
      ask_price: !message.a || isNaN(Number(message.a)) ? m : Number(message.a),
      last_price: Number(message.lp),
      ask_volume: Number(message.av),
    },
    timestamps: {
      providerIndicatedTimeUnixMs: new Date(message.t).getTime(),
    },
  }

  invalidPairs.delete(buildPair(params))
  return [
    {
      params: { ...params, requireVolume: true },
      response:
        isNaN(Number(message.bv)) || isNaN(Number(message.av))
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
