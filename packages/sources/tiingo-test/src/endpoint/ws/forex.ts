import { WebsocketReverseMappingTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { customSettings } from '../../config'
import { PriceCryptoRequestParams } from '../../crypto-utils'

interface Message {
  service: string
  messageType: string
  data: [string, string, string, string, string, number]
}

const tickerIndex = 1
const priceIndex = 5

type EndpointTypes = {
  Request: {
    Params: PriceCryptoRequestParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    WsMessage: Message
  }
}

let apiKey = ''
export const wsTransport: WebsocketReverseMappingTransport<EndpointTypes, string> =
  new WebsocketReverseMappingTransport<EndpointTypes, string>({
    url: (context) => {
      apiKey = context.adapterConfig.API_KEY
      return `${context.adapterConfig.WS_API_ENDPOINT}/fx`
    },

    handlers: {
      message(message) {
        const pair = wsTransport.getReverseMapping(message.data[tickerIndex])

        if (!message?.data?.length || message.messageType !== 'A' || !pair) {
          return []
        }

        return [
          {
            params: pair,
            response: {
              data: {
                result: message.data[priceIndex],
              },
              result: message.data[priceIndex],
            },
          },
        ]
      },
    },

    builders: {
      subscribeMessage: (params) => {
        wsTransport.setReverseMapping(`${params.base}${params.quote}`, params)
        return {
          eventName: 'subscribe',
          authorization: apiKey,
          eventData: {
            thresholdLevel: 5,
            tickers: [`${params.base}${params.quote}`.toLowerCase()],
          },
        }
      },
      unsubscribeMessage: (params) => {
        return {
          eventName: 'unsubscribe',
          authorization: apiKey,
          eventData: {
            thresholdLevel: 5,
            tickers: [`${params.base}${params.quote}`.toLowerCase()],
          },
        }
      },
    },
  })
