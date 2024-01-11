import { BaseEndpointTypes } from '../endpoint/forex'
import { TraderMadeWebsocketReverseMappingTransport } from './utils'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'

interface Message {
  symbol: string
  ts: string
  bid: number
  ask: number
  mid: number
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: Message
  }
}

export const config = {
  url: (context: EndpointContext<WsTransportTypes>) => {
    wsTransport.apiKey = context.adapterSettings.WS_API_KEY as string
    return context.adapterSettings.WS_API_ENDPOINT
  },
  handlers: {
    message(message: Message) {
      const pair = wsTransport.getReverseMapping(message.symbol.toUpperCase())

      if (!pair) {
        return []
      }
      return [
        {
          params: pair,
          response: {
            data: {
              result: message.mid,
            },
            result: message.mid,
          },
        },
      ]
    },
  },
  builders: {},
}

export const wsTransport: TraderMadeWebsocketReverseMappingTransport =
  new TraderMadeWebsocketReverseMappingTransport(config)
