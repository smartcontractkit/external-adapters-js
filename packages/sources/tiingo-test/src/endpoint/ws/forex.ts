import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { customSettings } from '../../config'
import { RouterPriceEndpointParams } from '../../crypto-utils'
import { TiingoWebsocketReverseMappingTransport } from '../../ws-utils'

interface Message {
  service: string
  messageType: string
  data: [string, string, string, string, string, number]
}

const tickerIndex = 1
const priceIndex = 5

type EndpointTypes = {
  Request: {
    Params: RouterPriceEndpointParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    WsMessage: Message
  }
}

export const wsTransport: TiingoWebsocketReverseMappingTransport<EndpointTypes, string> =
  new TiingoWebsocketReverseMappingTransport<EndpointTypes, string>({
    url: (context) => {
      wsTransport.apiKey = context.adapterConfig.API_KEY
      return `${context.adapterConfig.WS_API_ENDPOINT}/fx`
    },

    handlers: {
      message(message) {
        const pair = wsTransport.getReverseMapping(message.data[tickerIndex].toLowerCase())

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
        wsTransport.setReverseMapping(`${params.base}${params.quote}`.toLowerCase(), params)
        return {
          eventName: 'subscribe',
          authorization: wsTransport.apiKey,
          eventData: {
            thresholdLevel: 5,
            tickers: [`${params.base}${params.quote}`.toLowerCase()],
          },
        }
      },
      unsubscribeMessage: (params) => {
        return {
          eventName: 'unsubscribe',
          authorization: wsTransport.apiKey,
          eventData: {
            thresholdLevel: 5,
            tickers: [`${params.base}${params.quote}`.toLowerCase()],
          },
        }
      },
    },
  })
