import { TraderMadeWebsocketReverseMappingTransport } from '../ws-utils'
import { ForexEndpointTypes } from './forex-router'

interface Message {
  symbol: string
  ts: string
  bid: number
  ask: number
  mid: number
}

type EndpointTypes = ForexEndpointTypes & {
  Provider: {
    WsMessage: Message
  }
}

export const wsTransport: TraderMadeWebsocketReverseMappingTransport<EndpointTypes, string> =
  new TraderMadeWebsocketReverseMappingTransport<EndpointTypes, string>({
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
