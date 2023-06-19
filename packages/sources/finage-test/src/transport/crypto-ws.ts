import { WebsocketReverseMappingTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { BaseEndpointTypes } from '../endpoint/utils'

interface Message {
  s: string
  p: string
  q: string
  t: number
}

type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: Message
  }
}

export const wsTransport: WebsocketReverseMappingTransport<WsTransportTypes, string> =
  new WebsocketReverseMappingTransport<WsTransportTypes, string>({
    url: (context) => {
      return `${context.adapterSettings.CRYPTO_WS_API_ENDPOINT}/?token=${context.adapterSettings.WS_SOCKET_KEY}`
    },
    handlers: {
      message(message) {
        const pair = wsTransport.getReverseMapping(message.s.toLowerCase())
        if (!message.p || !pair) {
          return []
        }

        const result = Number(message.p)
        return [
          {
            params: pair,
            response: {
              data: {
                result,
              },
              result,
              timestamps: {
                providerIndicatedTimeUnixMs: message.t,
              },
            },
          },
        ]
      },
    },

    builders: {
      subscribeMessage: (params) => {
        wsTransport.setReverseMapping(`${params.base}${params.quote}`.toLowerCase(), params)
        return { action: 'subscribe', symbols: `${params.base}${params.quote}`.toUpperCase() }
      },
      unsubscribeMessage: (params) => {
        return { action: 'unsubscribe', symbols: `${params.base}${params.quote}`.toUpperCase() }
      },
    },
  })
