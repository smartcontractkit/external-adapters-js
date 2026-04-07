import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/price'
import {
  buildCloseStreamQuery,
  buildSubscriptionQuery,
  mapTradingEventToMarketStatus,
  MARKET_STATUS_UNKNOWN,
  toMilliseconds,
} from './utils'

const logger = makeLogger('SixPriceTransport')

const STALE_DATA_THRESHOLD_SECONDS = 300

type SixPriceField = {
  value?: number
  size?: number
  unixTimestamp?: number
}

type TradingEvent = {
  category?: string
  unixTimestamp?: number
}

type SixStreamMessage = {
  type: 'START' | 'UPDATE' | 'STOP' | 'ERROR'
  requestedId: string
  streamId: string
  requestedScheme: string
  last?: SixPriceField
  bestBid?: SixPriceField
  bestAsk?: SixPriceField
  mid?: SixPriceField
  volume?: SixPriceField
  tradingEvent?: TradingEvent
}

type WsMessage = {
  data?: {
    startStream?: SixStreamMessage[]
  }
  errors?: { message: string; category?: string; type?: string; messageCode?: number }[]
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WsMessage
  }
}

// SIX delivers `tradingEvent` as independent UPDATE frames, not on every tick,
// so we cache the latest status per stream to attach to subsequent price updates.
const lastMarketStatusByStreamId = new Map<string, number>()

let cachedCert: Buffer | undefined
let cachedKey: Buffer | undefined

const decodeCert = (base64: string): Buffer => {
  if (!cachedCert) {
    cachedCert = Buffer.from(base64, 'base64')
  }
  return cachedCert
}

const decodeKey = (base64: string): Buffer => {
  if (!cachedKey) {
    cachedKey = Buffer.from(base64, 'base64')
  }
  return cachedKey
}

const makeRipcordResult = (
  ticker: string,
  bc: string,
  details: string,
): ProviderResult<WsTransportTypes> => ({
  params: { ticker, bc },
  response: {
    statusCode: 502,
    errorMessage: `Ripcord activated for ${ticker}_${bc}. Details: ${details}`,
  },
})

export const generateTransport = () => {
  const transport = new WebSocketTransport<WsTransportTypes>({
    url: ({ adapterSettings: { WS_API_ENDPOINT } }) => WS_API_ENDPOINT,

    options: ({ adapterSettings: { TLS_PUBLIC_KEY, TLS_PRIVATE_KEY } }) => ({
      ...(TLS_PUBLIC_KEY && TLS_PRIVATE_KEY
        ? {
            cert: decodeCert(TLS_PUBLIC_KEY),
            key: decodeKey(TLS_PRIVATE_KEY),
          }
        : {}),
    }),

    handlers: {
      open: async () => {
        logger.info('Connected to SIX WebSocket API')
      },

      message: (message): ProviderResult<WsTransportTypes>[] | undefined => {
        if (message.errors) {
          logger.error({ errors: message.errors }, 'SIX API returned errors')
          return []
        }

        const streams = message.data?.startStream
        if (!streams) return []

        const results: ProviderResult<WsTransportTypes>[] = []

        for (const stream of streams) {
          const parts = stream.streamId.split('_')
          if (parts.length !== 2) {
            logger.warn({ streamId: stream.streamId }, 'Unexpected streamId format')
            continue
          }

          const [ticker, bc] = parts

          if (stream.type === 'ERROR') {
            logger.error(
              { streamId: stream.streamId, requestedId: stream.requestedId },
              'SIX stream error',
            )
            results.push(makeRipcordResult(ticker, bc, 'SIX stream error (check entitlements)'))
            continue
          }

          if (stream.type !== 'START' && stream.type !== 'UPDATE') continue

          if (stream.tradingEvent?.category != null) {
            const status = mapTradingEventToMarketStatus(stream.tradingEvent.category)
            lastMarketStatusByStreamId.set(stream.streamId, status)
            logger.debug(
              { streamId: stream.streamId, category: stream.tradingEvent.category, status },
              'Trading event received',
            )
          }

          const lastPrice = stream.last?.value

          if (lastPrice == null && stream.bestBid?.value == null && stream.bestAsk?.value == null) {
            logger.debug({ streamId: stream.streamId }, 'No price data in message')
            continue
          }

          const latestTimestamp =
            stream.last?.unixTimestamp ??
            stream.bestBid?.unixTimestamp ??
            stream.bestAsk?.unixTimestamp
          if (latestTimestamp != null) {
            const ageS = Date.now() / 1000 - latestTimestamp
            if (ageS > STALE_DATA_THRESHOLD_SECONDS) {
              logger.warn(
                { streamId: stream.streamId, ageS: Math.round(ageS) },
                'Stale data detected',
              )
              results.push(makeRipcordResult(ticker, bc, `Stale data (${Math.round(ageS)}s old)`))
              continue
            }
          }

          const mid =
            stream.mid?.value ??
            (stream.bestBid?.value != null && stream.bestAsk?.value != null
              ? (stream.bestBid.value + stream.bestAsk.value) / 2
              : undefined)

          const providerIndicatedTimeUnixMs = toMilliseconds(latestTimestamp)
          const marketStatus =
            lastMarketStatusByStreamId.get(stream.streamId) ?? MARKET_STATUS_UNKNOWN

          results.push({
            params: { ticker, bc },
            response: {
              result: lastPrice ?? mid ?? null,
              data: {
                mid: mid ?? null,
                bid: stream.bestBid?.value ?? null,
                bidSize: stream.bestBid?.size ?? null,
                ask: stream.bestAsk?.value ?? null,
                askSize: stream.bestAsk?.size ?? null,
                lastTradedPrice: lastPrice ?? null,
                volume: stream.volume?.value ?? null,
                marketStatus,
                ripcord: false,
                ripcordAsInt: 0,
              } as WsTransportTypes['Response']['Data'],
              timestamps: {
                providerIndicatedTimeUnixMs,
              },
            },
          })
        }

        return results
      },

      error: (errorEvent) => {
        logger.error({ errorEvent }, 'SIX WebSocket error')
      },

      close: (closeEvent) => {
        const code = (closeEvent as any)?.code
        const reason = (closeEvent as any)?.reason
        const wasClean = (closeEvent as any)?.wasClean
        logger.info({ code, reason, wasClean }, 'SIX WebSocket closed')
      },
    },

    builders: {
      subscribeMessage: (params, { adapterSettings: { CONFLATION_PERIOD } }) => ({
        query: buildSubscriptionQuery(params.ticker, params.bc, CONFLATION_PERIOD),
      }),

      unsubscribeMessage: (params) => ({
        query: buildCloseStreamQuery(params.ticker, params.bc),
      }),
    },
  })

  return transport
}
