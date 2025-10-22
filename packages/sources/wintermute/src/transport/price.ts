import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import {
  WebSocketTransport,
  WebSocketTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/price'

export interface PriceMessage {
  last_updated: string
  price: number
  symbol: string
}

export interface WSResponse {
  success: boolean
  data: Array<PriceMessage>
  topic: string
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WSResponse
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

      const results = []

      if (message.topic === 'price') {
        for (const item of message.data) {
          results.push({
            params: { index: item.symbol },
            response: {
              result: item.price,
              data: {
                result: item.price,
                symbol: item.symbol,
              },
              timestamps: {
                providerIndicatedTimeUnixMs: Date.parse(item.last_updated),
              },
            },
          })
        }
      }
      return results
    },
  },

  builders: {
    subscribeMessage: (params) => {
      return {
        op: 'subscribe',
        args: [`price.${params.index}`.toLowerCase()],
      }
    },

    unsubscribeMessage: (params) => {
      return {
        op: 'unsubscribe',
        args: [`price.${params.index}`.toLowerCase()],
      }
    },
  },
}

export const transport = new WebSocketTransport(options)
