import { BaseEndpointTypes } from '../endpoint/forex-router'
import { TraderMadeWebsocketReverseMappingTransport } from './utils'

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

export const wsTransport: TraderMadeWebsocketReverseMappingTransport<WsTransportTypes, string> =
  new TraderMadeWebsocketReverseMappingTransport<WsTransportTypes, string>({
    url: (context) => {
      wsTransport.apiKey = context.adapterSettings.WS_API_KEY as string
      return context.adapterSettings.WS_API_ENDPOINT
    },
    handlers: {
      message(message) {
        const pair = wsTransport.getReverseMapping(message.symbol.toLowerCase())

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

    builders: {
      subscribeMessage: (params) => {
        wsTransport.setReverseMapping(`${params.base}${params.quote}`.toLowerCase(), params)
        return {
          userKey: wsTransport.apiKey,
          symbol: `${params.base}${params.quote}`.toUpperCase(),
        }
      },
    },
  })
