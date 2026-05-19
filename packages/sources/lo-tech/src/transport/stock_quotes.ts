import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/stock_quotes'

export interface WSResponse {
  egress_ts: number // microseconds
  data: {
    type: 'PRICE'
    symbol: string
    ingress_ts: number // microseconds
    publish_ts: null
    transaction_ts: number // microseconds
    price: number
    spread: number
  }
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WSResponse
  }
}
export const wsTransport = new WebSocketTransport<WsTransportTypes>({
  url: (context) => context.adapterSettings.WS_API_ENDPOINT,
  options: (context) => {
    return {
      headers: {
        'X-API-KEY': context.adapterSettings.API_KEY,
      },
    }
  },
  handlers: {
    message(message) {
      if (message.data.type !== 'PRICE') {
        return
      }

      const mid_price = message.data.price
      const spread = message.data.spread
      const bid_price = mid_price - spread / 2
      const ask_price = mid_price + spread / 2

      return [
        {
          params: { base: message.data.symbol },
          response: {
            result: null,
            data: {
              mid_price,
              bid_price,
              ask_price,
            },
            timestamps: {
              providerIndicatedTimeUnixMs: Math.floor(message.egress_ts / 1000),
            },
          },
        },
      ]
    },
  },
  builders: {
    subscribeMessage: (params) => {
      return {
        op: 'SUBSCRIBE',
        topics: [
          {
            symbol: params.base,
            type: 'PRICE',
          },
        ],
      }
    },
    unsubscribeMessage: (params) => {
      return {
        op: 'UNSUBSCRIBE',
        topics: [
          {
            symbol: params.base,
            type: 'PRICE',
          },
        ],
      }
    },
  },
})
