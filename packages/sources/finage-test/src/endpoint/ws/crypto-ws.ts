import { WebsocketReverseMappingTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { PriceEndpointTypes } from '../types'

interface Message {
  s: string
  p: string
  q: string
  t: number
}

type EndpointTypes = PriceEndpointTypes & {
  Provider: {
    WsMessage: Message
  }
}

export const wsTransport: WebsocketReverseMappingTransport<EndpointTypes, string> =
  new WebsocketReverseMappingTransport<EndpointTypes, string>({
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
