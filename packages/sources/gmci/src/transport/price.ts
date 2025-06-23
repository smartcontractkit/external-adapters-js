import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/price'

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
    // @ts-ignore
    message(message) {
      if (message.success === false) {
        return
      }

      let data
      if (message.topic === 'price') {
        data = message.data[0] as PriceMessage
        return [
          {
            params: { index: data.symbol },
            response: {
              result: data.price,
              data: {
                result: data.price,
              },
              timestamps: {
                providerIndicatedTimeUnixMs: data.last_updated,
              },
            },
          },
        ]
      } else if (message.topic === 'rebalance_status') {
        data = message.data[0] as RebalanceMessage
        return
      }

      //   return [
      //   {
      //     params: { index: data.symbol },
      //     response: {
      //       result: data.price,
      //       data: {
      //         result: data.price,
      //       },
      //       timestamps: {
      //         providerIndicatedTimeUnixMs: data.last_updated,
      //       },
      //     },
      //   },
      // ]
    },
  },
  // `builders` are builder methods, that will be used to prepare specific WS messages to be sent to Data Provider
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
    // `unsubscribeMessage` accepts request parameters and should construct and return a payload that will be sent to Data Provider
    // Use this method to unsubscribe from live feeds
    unsubscribeMessage: (params) => {
      return {
        type: 'unsubscribe',
        symbols: `${params.index}`.toUpperCase(),
      }
    },
  },
})
