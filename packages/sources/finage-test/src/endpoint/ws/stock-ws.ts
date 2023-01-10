import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { customSettings } from '../../config'

interface Message {
  s: string
  a: string
  p: string
  b: string
  t: number
}

type EndpointTypes = {
  Request: {
    Params: { base: string }
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    WsMessage: Message
  }
}

export const wsTransport = new WebSocketTransport<EndpointTypes>({
  url: (context) => {
    return `${context.adapterConfig.STOCK_WS_API_ENDPOINT}/?token=${context.adapterConfig.WS_SOCKET_KEY}`
  },
  handlers: {
    message(message) {
      if (!message.p && !message.a && !message.b) {
        return []
      }

      let result
      if (message.p) {
        result = Number(message.p)
      } else {
        result = (Number(message.a) + Number(message.b)) / 2
      }

      return [
        {
          params: { base: message.s },
          response: {
            data: {
              result,
            },
            result,
            timestamps: {
              providerIndicatedTime: message.t,
            },
          },
        },
      ]
    },
  },

  builders: {
    subscribeMessage: (params) => {
      return { action: 'subscribe', symbols: `${params.base}`.toUpperCase() }
    },
    unsubscribeMessage: (params) => {
      return { action: 'unsubscribe', symbols: `${params.base}`.toUpperCase() }
    },
  },
})
