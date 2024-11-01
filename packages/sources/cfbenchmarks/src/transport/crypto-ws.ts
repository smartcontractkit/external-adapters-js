import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/crypto'

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

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: Message
  }
}

const logger = makeLogger('CfbenchmarksCryptoWebsocketEndpoint')

export const makeWsTransport = (
  type: 'primary' | 'secondary',
): WebSocketTransport<WsTransportTypes> => {
  return new WebSocketTransport<WsTransportTypes>({
    url: ({ adapterSettings: { WS_API_ENDPOINT, SECONDARY_WS_API_ENDPOINT } }) => {
      return type === 'primary' ? WS_API_ENDPOINT : SECONDARY_WS_API_ENDPOINT
    },

    options: ({ adapterSettings: { API_USERNAME, API_PASSWORD } }) => {
      const encodedCreds = Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString('base64')
      return {
        headers: {
          Authorization: `Basic ${encodedCreds}`,
        },
      }
    },

    handlers: {
      message(message) {
        logger.trace(message, 'Got response from websocket')
        if (message.type === 'value') {
          const index = message.id
          const value = Number(message.value)
          return [
            {
              params: {
                index,
                base: undefined,
                quote: undefined,
                ...(type != 'primary' && { adapterNameOverride: 'cfbenchmarks2' }),
              },
              response: {
                result: value,
                data: {
                  result: value,
                },
                timestamps: {
                  providerIndicatedTimeUnixMs: message.time,
                },
              },
            },
          ]
        }

        return
      },
    },
    builders: {
      subscribeMessage: ({ index }) => {
        return {
          type: 'subscribe',
          id: index,
          stream: 'value',
        }
      },

      unsubscribeMessage: ({ index }) => {
        return {
          type: 'unsubscribe',
          id: index,
          stream: 'value',
        }
      },
    },
  })
}
