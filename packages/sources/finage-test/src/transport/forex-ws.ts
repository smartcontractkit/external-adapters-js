import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { ForexBaseEndpointTypes } from '../endpoint/utils'
import { invertResult, createForexWsSymbol } from '../utils'

interface Message {
  s: string
  a: string
  b: string
  t: number
}
type WsTransportTypes = ForexBaseEndpointTypes & {
  Provider: {
    WsMessage: Message
  }
}

export const wsTransport = new WebSocketTransport<WsTransportTypes>({
  url: (context) => {
    return `${context.adapterSettings.FOREX_WS_API_ENDPOINT}/?token=${context.adapterSettings.WS_SOCKET_KEY}`
  },
  handlers: {
    message(message) {
      if (!message.a || !message.b) {
        return []
      }
      let [base, quote] = message.s.split('/')

      //USDJPY
      if (base == 'USD') {
        // Exception case: where base is USD
        // TODO add checks for that
        ;[quote, base] = [base, quote]
      }

      const result = invertResult(base, quote, (Number(message.a) + Number(message.b)) / 2)

      //EURUSD

      return [
        {
          params: { base, quote },
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
      return { action: 'subscribe', symbols: createForexWsSymbol(params.base, params.quote) }
    },
    unsubscribeMessage: (params) => {
      return { action: 'unsubscribe', symbols: createForexWsSymbol(params.base, params.quote) }
    },
  },
})
