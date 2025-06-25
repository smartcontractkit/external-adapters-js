import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
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

export const wsTransport = new WebSocketTransport<WsTransportTypes>({
  url: (context) => context.adapterSettings.WS_API_ENDPOINT,
  options: async (context) => ({
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
          params: { index: item.symbol },
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
        ;(message.data as RebalanceMessage[]).find(
          (item) => item.symbol === 'GMCI30',
        ) as RebalanceMessage
        return []
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
})
