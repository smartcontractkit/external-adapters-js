// import WebSocket from 'ws'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateCacheKey } from '@chainlink/external-adapter-framework/cache'
import {
  WebSocketTransport,
  WebSocketTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import { config } from '../config'
import { BaseEndpointTypes } from '../endpoint/price'
import { convertTimetoUnixMs } from './util'

export interface PriceMessage {
  last_updated: string
  price: number
  symbol: string
}

export interface RebalanceMessage {
  end_time: string
  start_time: string
  status: string
  symbol: string
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
  override buildConnectionHandlers(
    context: EndpointContext<BaseEndpointTypes>,
    connection: WebSocket,
    connectionReadyResolve: (value: WebSocket) => void,
  ) {
    const handlers = super.buildConnectionHandlers(context, connection, connectionReadyResolve)

    handlers.message = async (event) => {
      await super
        .buildConnectionHandlers(context, connection, connectionReadyResolve)
        .message(event)
      const parsed = super.deserializeMessage(event.data)

      for (const data of parsed.data) {
        const price_data = await this.responseCache.cache.get(
          calculateCacheKey({
            transportName: this.name,
            data: { index: data.symbol, type: 'price' },
            adapterName: 'GMCI',
            endpointName: 'price',
            adapterSettings: config.settings,
          }),
        )

        const rebalance_data = await this.responseCache.cache.get(
          calculateCacheKey({
            transportName: this.name,
            data: { index: data.symbol, type: 'rebalance_status' },
            adapterName: 'GMCI',
            endpointName: 'price',
            adapterSettings: config.settings,
          }),
        )

        if (price_data != undefined && rebalance_data != undefined) {
          const result = {
            params: { index: data.symbol },
            response: {
              statusCode: 200,
              result: Number(price_data.result),
              data: { ...rebalance_data.data, result: price_data.result },
              timestamps: price_data.timestamps,
            },
          }

          await this.responseCache.cache.set(
            calculateCacheKey({
              transportName: this.name,
              data: { index: parsed.data[0].symbol },
              adapterName: 'GMCI',
              endpointName: 'price',
              adapterSettings: config.settings,
            }),
            result.response,
            90000,
          )
        }
      }
    }

    return handlers
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
        const result = (message.data as PriceMessage[]).map((item) => ({
          params: { index: item.symbol, type: 'price' },
          response: {
            result: item.price,
            data: {
              result: item.price,
            },
            timestamps: {
              providerIndicatedTimeUnixMs: convertTimetoUnixMs(item.last_updated),
            },
          },
        }))

        return result
      } else if (message.topic === 'rebalance_status') {
        const result = (message.data as RebalanceMessage[]).map((item) => ({
          params: { index: item.symbol, type: 'rebalance_status' },
          response: {
            result: 0,
            data: {
              status: item.status,
              end_time: item.end_time,
              start_time: item.start_time,
              symbol: item.symbol,
            },
          },
        }))

        return result
      } else {
        return []
      }
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
