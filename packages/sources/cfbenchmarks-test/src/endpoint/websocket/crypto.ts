import { makeLogger } from '@chainlink/external-adapter-framework/util'
import {
  WebSocketTransport,
  WebSocketRawData,
} from '@chainlink/external-adapter-framework/transports/websocket'
import { WebSocket } from '@chainlink/external-adapter-framework/transports/websocket'
import { EndpointTypes, getIdFromBaseQuote, getBaseQuoteFromId } from '../common/crypto'

interface Message {
  type: 'subscribe' | 'unsubscribe' | 'value'
  id: string
  value: string
  time: number
}
export interface WsErrorType {
  TYPE: string
  MESSAGE: string
  PARAMETER: string
  INFO: string
}

export type WsEndpointTypes = EndpointTypes & {
  Provider: {
    WsMessage: Message
  }
}

const logger = makeLogger('CfbenchmarksCryptoWebsocketEndpoint')

export const transport = new WebSocketTransport<WsEndpointTypes>({
  url: ({ adapterConfig: { DEFAULT_WS_API_ENDPOINT } }) => DEFAULT_WS_API_ENDPOINT,

  options: ({ adapterConfig: { API_USERNAME, API_PASSWORD } }) => {
    const encodedCreds = Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString('base64')
    return {
      headers: {
        Authorization: `Basic ${encodedCreds}`,
      },
    }
  },

  handlers: {
    open(connection: WebSocket) {
      return new Promise((resolve, reject) => {
        // Set up listener
        connection.on('message', (data: WebSocketRawData) => {
          const parsed = JSON.parse(data.toString())
          if (parsed.MESSAGE === 'STREAMERWELCOME') {
            logger.info('Got logged in response, connection is ready')
            resolve()
          } else {
            reject(new Error('Unexpected message after WS connection open'))
          }
        })
      })
    },

    message(message) {
      logger.trace(message, 'Got response from websocket')
      if (message.type === 'value') {
        const { base, quote } = getBaseQuoteFromId(message.id)
        const value = Number(message.value)
        return [
          {
            params: { base, quote },
            value,
          },
        ]
      }

      return
    },
  },
  builders: {
    subscribeMessage: ({ base, quote }) => {
      return { type: 'subscribe', id: getIdFromBaseQuote(base, quote, 'primary'), stream: 'value' }
    },

    unsubscribeMessage: ({ base, quote }) => {
      return {
        type: 'unsubscribe',
        id: getIdFromBaseQuote(base, quote, 'primary'),
        stream: 'value',
      }
    },
  },
})

export const transportSecondary = new WebSocketTransport<WsEndpointTypes>({
  url: ({ adapterConfig: { SECONDARY_WS_API_ENDPOINT } }) => SECONDARY_WS_API_ENDPOINT,

  options: ({ adapterConfig: { API_USERNAME, API_PASSWORD } }) => {
    const encodedCreds = Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString('base64')
    return {
      headers: {
        Authorization: `Basic ${encodedCreds}`,
      },
    }
  },

  handlers: {
    open(connection: WebSocket) {
      return new Promise((resolve, reject) => {
        // Set up listener
        connection.on('message', (data: WebSocketRawData) => {
          const parsed = JSON.parse(data.toString())
          if (parsed.MESSAGE === 'STREAMERWELCOME') {
            logger.info('Got logged in response, connection is ready')
            resolve()
          } else {
            reject(new Error('Unexpected message after WS connection open'))
          }
        })
      })
    },

    message(message) {
      logger.trace(message, 'Got response from websocket')
      if (message.type === 'value') {
        const { base, quote } = getBaseQuoteFromId(message.id)
        const value = Number(message.value)
        return [
          {
            params: { base, quote },
            value,
          },
        ]
      }

      return
    },
  },
  builders: {
    subscribeMessage: ({ base, quote }) => {
      return {
        type: 'subscribe',
        id: getIdFromBaseQuote(base, quote, 'secondary'),
        stream: 'value',
      }
    },

    unsubscribeMessage: ({ base, quote }) => {
      return {
        type: 'unsubscribe',
        id: getIdFromBaseQuote(base, quote, 'secondary'),
        stream: 'value',
      }
    },
  },
})
