import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { LocalCache } from '@chainlink/external-adapter-framework/cache'
import {
  WebSocketTransport,
  WebSocketTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import { TimestampedProviderResult } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/price'
import { convertTimetoUnixMs } from './util'

export interface PriceMessage {
  last_updated: string
  price: number
  symbol: string
}

export interface CachedPriceResponse {
  params: {
    index: string
    type: string
  }
  response: {
    result: number
    data: {
      result: number
      symbol: string
    }
    timestamps: {
      providerIndicatedTimeUnixMs: number
    }
  }
}

export interface RebalanceMessage {
  end_time: string
  start_time: string
  status: string
  symbol: string
}

export interface CachedRebalanceResponse {
  params: {
    index: string
    type: string
  }
  response: {
    data: {
      status: string
      end_time: string
      start_time: string
      symbol: string
    }
  }
}

export interface WSResponse {
  success: boolean
  data: Array<PriceMessage | RebalanceMessage>
  topic: string
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WSResponse
  }
}

export class GMCIWebsocketTransport extends WebSocketTransport<WsTransportTypes> {
  price_cache = new LocalCache<CachedPriceResponse>(10)
  rebalance_status_cache = new LocalCache<CachedRebalanceResponse>(10)
}

export async function processMessage(symbols: Array<string>, transport: GMCIWebsocketTransport) {
  for (const symbol of symbols) {
    const [cached_price_data, cached_rebalance_data] = await Promise.all([
      transport.price_cache.get(symbol),
      transport.rebalance_status_cache.get(symbol),
    ])

    if (cached_price_data != undefined && cached_rebalance_data != undefined) {
      const now = Date.now()

      const price_data = cached_price_data as CachedPriceResponse
      const rebalance_data = cached_rebalance_data as CachedRebalanceResponse

      const result: TimestampedProviderResult<WsTransportTypes> = {
        params: { index: symbol },
        response: {
          result: price_data.response.result,
          data: {
            result: price_data.response.result,
            status: rebalance_data.response.data.status,
            end_time: rebalance_data.response.data.end_time,
            start_time: rebalance_data.response.data.start_time,
            symbol,
          },
          timestamps: {
            providerDataStreamEstablishedUnixMs: transport.providerDataStreamEstablished,
            providerDataReceivedUnixMs: now,
            providerIndicatedTimeUnixMs: price_data.response.timestamps.providerIndicatedTimeUnixMs,
          },
        },
      }

      await transport.responseCache.write(transport.name, [result])
    }
  }
}

export const options: WebSocketTransportConfig<WsTransportTypes> = {
  url: (context: EndpointContext<WsTransportTypes>) => context.adapterSettings.WS_API_ENDPOINT,
  options: async (context: EndpointContext<WsTransportTypes>) => ({
    headers: {
      'X-GMCI-API-KEY': context.adapterSettings.API_KEY,
    },
  }),

  handlers: {
    message(message) {
      if (message.success === false) {
        return
      }

      if (message.topic === 'price') {
        for (const item of message.data as PriceMessage[]) {
          const result = {
            params: { index: item.symbol, type: 'price' },
            response: {
              result: item.price,
              data: {
                result: item.price,
                symbol: item.symbol,
              },
              timestamps: {
                providerIndicatedTimeUnixMs: convertTimetoUnixMs(item.last_updated),
              },
            },
          }
          transport.price_cache.set(item.symbol, result, 90000)
        }
      } else if (message.topic === 'rebalance_status') {
        for (const item of message.data as RebalanceMessage[]) {
          const result = {
            params: { index: item.symbol, type: 'rebalance_status' },
            response: {
              data: {
                status: item.status,
                end_time: item.end_time,
                start_time: item.start_time,
                symbol: item.symbol,
              },
            },
          }
          transport.rebalance_status_cache.set(item.symbol, result, 90000)
        }
      }

      const symbols: Array<string> = (message.data as any[]).map((d) => d.symbol)

      processMessage(symbols, transport)

      return []
    },
  },

  builders: {
    subscribeMessage: (params) => {
      return {
        op: 'subscribe',
        args: [
          `price.${params.index}`.toLowerCase(),
          `rebalance_status.${params.index}`.toLowerCase(),
        ],
      }
    },

    unsubscribeMessage: (params) => {
      return {
        op: 'unsubscribe',
        args: [
          `price.${params.index}`.toLowerCase(),
          `rebalance_status.${params.index}`.toLowerCase(),
        ],
      }
    },
  },
}

export const transport = new GMCIWebsocketTransport(options)
