import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { cryptoRequestTransform, inputParameters, RequestParams } from '../common/crypto'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { config } from '../../config'

const logger = makeLogger('CfbenchmarksCryptoLwbaWebsocketEndpoint')

interface WSResponseError {
  type: string
  id: string
  stream: string
  success: boolean
  reason: string
}

interface WSResponse {
  type: string
  time: number
  id: string
  value: number
  utilizedDepth: number
  valueAsk: number
  valueBid: number
  midPrice: number
}

interface EPResponse {
  Result: null
  Data: {
    value: number
    bid: number
    ask: number
    mid: number
    utilizedDepth: number
  }
}

type WsEndpointTypes = {
  Request: RequestParams
  Response: EPResponse
  Settings: typeof config.settings
  Provider: {
    WsMessage: WSResponse & WSResponseError
  }
}

export const wsTransport = new WebSocketTransport<WsEndpointTypes>({
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
      if (!message.success === false) {
        logger.warn(message, `Got error response from websocket: '${message.reason}'`)
        return
      }

      return [
        {
          params: { index: message.id },
          response: {
            result: null,
            data: {
              value: message.value,
              bid: message.valueBid,
              ask: message.valueAsk,
              mid: message.midPrice,
              utilizedDepth: message.utilizedDepth,
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

export const endpoint = new AdapterEndpoint<WsEndpointTypes>({
  name: 'crypto_lwba',
  aliases: ['cryptolwba'],
  transport: wsTransport,
  inputParameters: inputParameters,
  requestTransforms: [cryptoRequestTransform],
})
