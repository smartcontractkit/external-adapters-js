import { WebsocketReverseMappingTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { EquitiesEndpointTypes } from '../endpoint/utils'

interface Message {
  s: string
  p: string
  dc: string
  dd: string
  t: number
}

type WsTransportTypes = EquitiesEndpointTypes & {
  Provider: {
    WsMessage: Message
  }
}

export const wsTransport: WebsocketReverseMappingTransport<WsTransportTypes, string> =
  new WebsocketReverseMappingTransport<WsTransportTypes, string>({
    url: (context) => {
      return `${context.adapterSettings.ETF_WS_API_ENDPOINT}/?token=${context.adapterSettings.WS_SOCKET_KEY}`
    },
    handlers: {
      message(message) {
        if (!message.s && !message.p && !message.t) {
          return []
        }

        const result = Number(message.p)

        return [
          {
            params: { base: message.s },
            response: {
              data: {
                result,
              },
              result,
              timestamps: {
                // convert seconds to milliseconds
                providerIndicatedTimeUnixMs: Number(message.t) * 1000,
              },
            },
          },
        ]
      },
    },

    builders: {
      subscribeMessage: (params) => {
        return { action: 'subscribe', symbols: params.base?.toUpperCase() }
      },
      unsubscribeMessage: (params) => {
        return { action: 'unsubscribe', symbols: params.base?.toUpperCase() }
      },
    },
  })
