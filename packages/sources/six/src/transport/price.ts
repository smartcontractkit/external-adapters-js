import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/price'
import { buildCloseStreamQuery, buildSubscriptionQuery, toMilliseconds } from './utils'

const logger = makeLogger('SixPriceTransport')

// Max acceptable age for price data before triggering ripcord (in seconds)
const STALE_DATA_THRESHOLD_S = 300 // 5 minutes

type SixPriceField = {
  value?: number
  size?: number
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

// Cache decoded cert/key buffers to avoid repeated Base64 decoding on reconnect
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
        // API-level errors (auth failures, quota exceeded, etc.)
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

          // Ripcord: SIX stream-level error (entitlement issues, invalid listing)
          if (stream.type === 'ERROR') {
            logger.error(
              { streamId: stream.streamId, requestedId: stream.requestedId },
              'SIX stream error',
            )
            results.push(makeRipcordResult(ticker, bc, 'SIX stream error (check entitlements)'))
            continue
          }

          if (stream.type !== 'START' && stream.type !== 'UPDATE') continue

          const lastPrice = stream.last?.value

          // No price data - skip (not ripcord, just an empty update e.g. volume-only)
          if (lastPrice == null && stream.bestBid?.value == null && stream.bestAsk?.value == null) {
            logger.debug({ streamId: stream.streamId }, 'No price data in message')
            continue
          }

          // Ripcord: stale data - timestamp too old
          const latestTimestamp =
            stream.last?.unixTimestamp ??
            stream.bestBid?.unixTimestamp ??
            stream.bestAsk?.unixTimestamp
          if (latestTimestamp != null) {
            const ageS = Date.now() / 1000 - latestTimestamp
            if (ageS > STALE_DATA_THRESHOLD_S) {
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
