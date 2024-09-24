import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/price'

export interface WSResponse {
  timestamp: number
  price: number
  marketDepthUSDUp: number
  marketDepthUSDDown: number
  volume24h: number
  baseSymbol: string
  quoteSymbol: string
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WSResponse
  }
}
export const wsTransport = new WebSocketTransport<WsTransportTypes>({
  url: (context) => context.adapterSettings.WS_API_ENDPOINT,
  handlers: {
    open: (connection, context) => {
      connection.send(
        JSON.stringify({ type: 'feed', authorization: context.adapterSettings.API_KEY }),
      )
    },
    message(message) {
      if (!message.price) {
        return [
          {
            params: {
              base: message.baseSymbol,
              quote: message.quoteSymbol,
            },
            response: {
              errorMessage: 'No price in message',
              statusCode: 500,
            },
          },
        ]
      }

      return [
        {
          params: { base: message.baseSymbol, quote: message.quoteSymbol },
          response: {
            result: message.price,
            data: {
              result: message.price,
            },
            timestamps: {
              providerIndicatedTimeUnixMs: message.timestamp,
            },
          },
        },
      ]
    },
  },
})
