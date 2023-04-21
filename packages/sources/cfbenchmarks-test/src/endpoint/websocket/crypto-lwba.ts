import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { additionalInputValidation, inputParameters, RequestParams } from '../common/crypto'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { config } from '../../config'
import { getSecondaryId } from '../../utils'
import { AdapterRequest } from '@chainlink/external-adapter-framework/util'

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
  value: string
  utilizedDepth: string
  valueAsk: string
  valueBid: string
  midPrice: string
}

interface EPResponse {
  Result: number
  Data: {
    bid: number
    ask: number
    mid: number
    midPrice: number
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
      if (message.success === false) {
        logger.warn(message, `Got error response from websocket: '${message.reason}'`)
        return
      }

      return [
        {
          params: { index: message.id },
          response: {
            result: Number(message.value),
            data: {
              bid: Number(message.valueBid),
              ask: Number(message.valueAsk),
              mid: Number(message.value),
              midPrice: Number(message.midPrice),
              utilizedDepth: Number(message.utilizedDepth),
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

export const lwbaReqTransformer = (req: AdapterRequest<RequestParams>): void => {
  additionalInputValidation(req.requestContext.data)

  if (!req.requestContext.data.index) {
    req.requestContext.data.index = getSecondaryId(
      req.requestContext.data.base as string,
      req.requestContext.data.quote as string,
    )
  }

  // Clear base quote to ensure an exact match in the cache with index
  delete req.requestContext.data.base
  delete req.requestContext.data.quote
}

export const endpoint = new AdapterEndpoint<WsEndpointTypes>({
  name: 'crypto_lwba',
  aliases: ['cryptolwba'],
  transport: wsTransport,
  inputParameters: inputParameters,
  requestTransforms: [lwbaReqTransformer],
})
