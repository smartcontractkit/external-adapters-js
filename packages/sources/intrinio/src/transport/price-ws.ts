import {
  WebSocketTransport,
  WebsocketTransportGenerics,
} from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/price'
import { IntrinioRealtime } from './util'

export type IntrinioFeedMessage = {
  topic: string
  payload: {
    type: string
    timestamp: number
    ticker: string
    size: number
    price: number
  }
  event: string
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: IntrinioFeedMessage
  }
}

export class IntrinioWebsocketTransport<
  T extends WebsocketTransportGenerics,
> extends WebSocketTransport<T> {
  ws: IntrinioRealtime = null as unknown as IntrinioRealtime
}

export const wsTransport: IntrinioWebsocketTransport<WsTransportTypes> =
  new IntrinioWebsocketTransport<WsTransportTypes>({
    url: (context) => {
      const { API_KEY } = context.adapterSettings
      if (!wsTransport.ws) {
        wsTransport.ws = new IntrinioRealtime({
          api_key: API_KEY,
          provider: 'iex',
        })
      }
      return wsTransport.ws._makeSocketUrl.bind(wsTransport.ws)()
    },
    handlers: {
      open: (connection) => {
        const heartbeatMsg = JSON.stringify(wsTransport.ws._makeHeartbeatMessage())
        connection.send(heartbeatMsg)
      },
      message(message) {
        if (message.event !== 'quote' || !message.payload || message.payload?.type !== 'last') {
          return []
        }

        const base = message.payload.ticker
        const price = message.payload.price

        return [
          {
            params: { base },
            response: {
              result: price,
              data: {
                result: price,
              },
              timestamps: {
                providerIndicatedTimeUnixMs: new Date(message.payload.timestamp * 1000).getTime(), // Convert to proper timestamp
              },
            },
          },
        ]
      },
    },
    builders: {
      subscribeMessage: (params) => {
        return wsTransport.ws._makeJoinMessage(params.base)
      },
      unsubscribeMessage: (params) => {
        return wsTransport.ws._makeLeaveMessage(params.base)
      },
    },
  })
