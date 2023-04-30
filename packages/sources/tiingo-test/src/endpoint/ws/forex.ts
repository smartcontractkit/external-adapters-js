import { TiingoWebsocketReverseMappingTransport } from '../../ws-utils'
import { ForexEndpointTypes } from '../common/forex-router'

interface Message {
  service: string
  messageType: string
  data: [string, string, string, string, string, number]
}

const tickerIndex = 1
const dateIndex = 2
const priceIndex = 5

type EndpointTypes = ForexEndpointTypes & {
  Provider: {
    WsMessage: Message
  }
}

export const wsTransport: TiingoWebsocketReverseMappingTransport<EndpointTypes, string> =
  new TiingoWebsocketReverseMappingTransport<EndpointTypes, string>({
    url: (context) => {
      wsTransport.apiKey = context.adapterSettings.API_KEY
      return `${context.adapterSettings.WS_API_ENDPOINT}/fx`
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
              timestamps: {
                providerIndicatedTimeUnixMs: new Date(message.data[dateIndex]).getTime(),
              },
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
