import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { PriceEndpointParams } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from '../../config'

interface Message {
  s: string
  p: string
  q: string
  t: number
}

type EndpointTypes = {
  Request: {
    Params: PriceEndpointParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    WsMessage: Message
  }
}

export const wsTransport = new WebSocketTransport<EndpointTypes>({
  url: (context) => {
    return `${context.adapterConfig.CRYPTO_WS_API_ENDPOINT}/?token=${context.adapterConfig.WS_SOCKET_KEY}`
  },
  handlers: {
    message(message) {
      if (!message.p) {
        return []
      }
      // Finage returns pair information combined without delimiter, like `s: ethusd` which makes it not possible to have base and quote. Once params are passed in the message handler we can use them to have correct base and quote in the response.
      const result = Number(message.p)
      return [
        {
          params: { base: message.s, quote: message.s },
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
      return { action: 'subscribe', symbols: `${params.base}${params.quote}`.toUpperCase() }
    },
    unsubscribeMessage: (params) => {
      return { action: 'unsubscribe', symbols: `${params.base}${params.quote}`.toUpperCase() }
    },
  },
})
