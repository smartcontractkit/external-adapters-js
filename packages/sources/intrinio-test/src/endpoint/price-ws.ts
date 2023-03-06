import {
  WebSocketTransport,
  WebsocketTransportGenerics,
} from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { customSettings } from '../config'
import { RequestParams } from './price-router'
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

export type EndpointTypes = {
  Request: {
    Params: RequestParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    WsMessage: IntrinioFeedMessage[]
  }
}

export class IntrinioWebsocketTransport<
  T extends WebsocketTransportGenerics,
> extends WebSocketTransport<T> {
  ws: IntrinioRealtime = null as unknown as IntrinioRealtime
}

export const wsTransport: IntrinioWebsocketTransport<EndpointTypes> =
  new IntrinioWebsocketTransport<EndpointTypes>({
    url: (context) => {
      const { API_KEY } = context.adapterConfig
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
        return message
          .filter((msg) => msg.event === 'quote' && msg.payload?.type === 'last')
          .map((msg) => {
            const base = msg.payload.ticker
            const price = msg.payload.price
            return {
              params: { base },
              response: {
                result: price,
                data: {
                  result: price,
                },
                timestamps: {
                  providerIndicatedTimeUnixMs: new Date(msg.payload.timestamp).getTime(),
                },
              },
            }
          })
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
