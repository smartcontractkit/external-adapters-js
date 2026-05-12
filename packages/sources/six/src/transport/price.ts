import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import axios from 'axios'
import https from 'https'
import { BaseEndpointTypes } from '../endpoint/price'
import {
  buildCloseStreamQuery,
  buildSubscriptionQuery,
  mapMarketBaseStatusToV11,
  MARKET_STATUS_UNKNOWN,
  toMilliseconds,
} from './utils'

const logger = makeLogger('SixPriceTransport')

const STALE_DATA_THRESHOLD_SECONDS = 300
const MARKET_BASE_REQUEST_TIMEOUT_MS = 10_000

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

type MarketBaseMarket = {
  lookupStatus?: string
  referenceData?: {
    marketBase?: {
      marketStatus?: string
    }
  }
}

type MarketBaseResponse = {
  data?: {
    markets?: MarketBaseMarket[]
  }
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WsMessage
  }
}

// Market Base `marketStatus` is quasi-static (exchange-level flag, not session
// state). Cache per BC for the process lifetime; on the first message for a
// new BC we kick off an async fetch and return MARKET_STATUS_UNKNOWN until the
// cache is populated.
const marketStatusByBc = new Map<string, number>()
const pendingMarketStatusFetches = new Set<string>()

let cachedCredentials: { cert: Buffer; key: Buffer } | undefined
let cachedHttpsAgent: https.Agent | undefined

const getCredentials = (certBase64: string, keyBase64: string) => {
  if (!cachedCredentials) {
    cachedCredentials = {
      cert: Buffer.from(certBase64, 'base64'),
      key: Buffer.from(keyBase64, 'base64'),
    }
  }
  return cachedCredentials
}

const getHttpsAgent = (): https.Agent | undefined => {
  if (!cachedCredentials) return undefined
  if (!cachedHttpsAgent) {
    cachedHttpsAgent = new https.Agent({
      cert: cachedCredentials.cert,
      key: cachedCredentials.key,
    })
  }
  return cachedHttpsAgent
}

const fetchMarketBaseStatus = async (bc: string, restEndpoint: string): Promise<number> => {
  const httpsAgent = getHttpsAgent()
  if (!httpsAgent) throw new Error('mTLS credentials not initialized')
  const response = await axios.get<MarketBaseResponse>(
    `${restEndpoint}/web/v2/markets/referenceData/marketBase`,
    {
      params: { scheme: 'BC', ids: bc },
      headers: { accept: 'application/json' },
      httpsAgent,
      timeout: MARKET_BASE_REQUEST_TIMEOUT_MS,
    },
  )
  const status = response.data.data?.markets?.[0]?.referenceData?.marketBase?.marketStatus
  return mapMarketBaseStatusToV11(status)
}

const ensureMarketStatusFetched = (bc: string, restEndpoint: string): void => {
  if (marketStatusByBc.has(bc) || pendingMarketStatusFetches.has(bc)) return
  if (!cachedCredentials) return
  pendingMarketStatusFetches.add(bc)
  fetchMarketBaseStatus(bc, restEndpoint)
    .then((status) => {
      marketStatusByBc.set(bc, status)
      logger.info({ bc, status }, 'Market base status fetched')
    })
    .catch((error) => {
      logger.error({ bc, error: String(error) }, 'Failed to fetch market base status')
    })
    .finally(() => {
      pendingMarketStatusFetches.delete(bc)
    })
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

    options: ({ adapterSettings: { TLS_PUBLIC_KEY, TLS_PRIVATE_KEY } }) => {
      if (!TLS_PUBLIC_KEY || !TLS_PRIVATE_KEY) {
        throw new Error('TLS_PUBLIC_KEY and TLS_PRIVATE_KEY must be set (Base64-encoded)')
      }
      const { cert, key } = getCredentials(TLS_PUBLIC_KEY, TLS_PRIVATE_KEY)
      return { cert, key }
    },

    handlers: {
      open: async () => {
        logger.info('Connected to SIX WebSocket API')
      },

      message: (message, context): ProviderResult<WsTransportTypes>[] | undefined => {
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

          ensureMarketStatusFetched(bc, context.adapterSettings.REST_API_ENDPOINT)
          const marketStatus = marketStatusByBc.get(bc) ?? MARKET_STATUS_UNKNOWN

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
                mid,
                bid: stream.bestBid?.value,
                bidSize: stream.bestBid?.size,
                ask: stream.bestAsk?.value,
                askSize: stream.bestAsk?.size,
                lastTradedPrice: lastPrice,
                volume: stream.volume?.value,
                marketStatus,
                ripcord: false,
                ripcordAsInt: 0,
              },
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
