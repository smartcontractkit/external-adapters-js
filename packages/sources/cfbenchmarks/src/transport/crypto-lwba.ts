import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/crypto-lwba'

const logger = makeLogger('CfbenchmarksCryptoLwbaWebsocketEndpoint')

export interface WSResponseError {
  type: string
  id: string
  stream: string
  success: boolean
  reason: string
}

export interface WSResponse {
  type: string
  time: number
  id: string
  value: string
  utilizedDepth: string
  valueAsk: string
  valueBid: string
  midPrice: string
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WSResponse & WSResponseError
  }
}

export const wsTransport = new WebSocketTransport<WsTransportTypes>({
  url: (context) => {
    return context.adapterSettings.API_SECONDARY
      ? context.adapterSettings.SECONDARY_WS_API_ENDPOINT
      : context.adapterSettings.WS_API_ENDPOINT
  },

  options: (context) => {
    return {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${context.adapterSettings.API_USERNAME}:${context.adapterSettings.API_PASSWORD}`,
        ).toString('base64')}`,
      },
    }
  },

  handlers: {
    message(message) {
      if (message.success === false) {
        logger.warn(message, `Got error response from websocket: '${message.reason}'`)
        return
      }

      return [
        {
          params: { index: message.id, base: undefined, quote: undefined },
          response: {
            result: null,
            data: {
              bid: Number(message.valueBid),
              ask: Number(message.valueAsk),
              mid: Number(message.value),
            },
            timestamps: {
              providerIndicatedTimeUnixMs: message.time,
            },
          },
        },
      ]
    },
  },

  builders: {
    subscribeMessage: (params) => {
      return {
        type: 'subscribe',
        id: params.index,
        stream: 'rti_stats',
      }
    },

    unsubscribeMessage: (params) => {
      return {
        type: 'unsubscribe',
        id: params.index,
        stream: 'rti_stats',
      }
    },
  },
})
