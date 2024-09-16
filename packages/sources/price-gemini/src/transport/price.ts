import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/price'

export interface WSResponse {
  success: boolean
  price: number
  base: string
  quote: string
  time: number
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WSResponse
  }
}
export const wsTransport = new WebSocketTransport<WsTransportTypes>({
  url: (context) => context.adapterSettings.WS_API_ENDPOINT,
  handlers: {
    message(message) {
      if (message.success === false) {
        return
      }

      return [
        {
          params: { base: message.base, quote: message.quote },
          response: {
            result: message.price,
            data: {
              result: message.price,
            },
            timestamps: {
              providerIndicatedTimeUnixMs: message.time,
            },
          },
        },
      ]
    },
  },
  builders: {
    subscribeMessage: (params) => {
      return {
        type: 'subscribe',
        symbols: `${params.base}/${params.quote}`.toUpperCase(),
      }
    },
    unsubscribeMessage: (params) => {
      return {
        type: 'unsubscribe',
        symbols: `${params.base}/${params.quote}`.toUpperCase(),
      }
    },
  },
})
