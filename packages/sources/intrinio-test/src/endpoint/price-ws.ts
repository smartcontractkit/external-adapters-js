import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { customSettings } from '../config'
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
    Params: { base: string }
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    WsMessage: IntrinioFeedMessage[]
  }
}

let ws: IntrinioRealtime
export const wsTransport = new WebSocketTransport<EndpointTypes>({
  url: (context) => {
    const { API_KEY } = context.adapterConfig
    if (!ws) {
      ws = new IntrinioRealtime({
        api_key: API_KEY,
        provider: 'iex',
      })
    }
    return ws._makeSocketUrl.bind(ws)()
  },
  handlers: {
    open: (connection) => {
      const heartbeatMsg = JSON.stringify(ws._makeHeartbeatMessage())
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
      return ws._makeJoinMessage(params.base)
    },
    unsubscribeMessage: (params) => {
      return ws._makeLeaveMessage(params.base)
    },
  },
})
