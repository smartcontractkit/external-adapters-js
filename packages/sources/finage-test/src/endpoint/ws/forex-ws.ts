import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { customSettings } from '../../config'
import { ForexEndpointParams } from '../forex-router'

interface Message {
  s: string
  a: string
  b: string
  t: number
}
type EndpointTypes = {
  Request: {
    Params: ForexEndpointParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    WsMessage: Message
  }
}

export const wsTransport = new WebSocketTransport<EndpointTypes>({
  url: (context) => {
    return `${context.adapterConfig.FOREX_WS_API_ENDPOINT}/?token=${context.adapterConfig.WS_SOCKET_KEY}`
  },
  handlers: {
    message(message) {
      if (!message.a || !message.b) {
        return []
      }
      const result = (Number(message.a) + Number(message.b)) / 2
      const [base, quote] = message.s.split('/')
      return [
        {
          params: { base, quote, transport: 'ws' },
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
      return { action: 'subscribe', symbols: `${params.base}/${params.quote}`.toUpperCase() }
    },
    unsubscribeMessage: (params) => {
      return { action: 'unsubscribe', symbols: `${params.base}/${params.quote}`.toUpperCase() }
    },
  },
})
