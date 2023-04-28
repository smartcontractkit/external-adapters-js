import { TiingoWebsocketTransport } from '../../ws-utils'
import { IEXEndpointTypes } from '../common/iex-router'

interface Message {
  service: string
  messageType: string
  data: [string, string, string, string, string, number]
}

const tickerIndex = 3
const priceIndex = 5

type EndpointTypes = IEXEndpointTypes & {
  Provider: {
    WsMessage: Message
  }
}

export const wsTransport: TiingoWebsocketTransport<EndpointTypes> =
  new TiingoWebsocketTransport<EndpointTypes>({
    url: (context) => {
      wsTransport.apiKey = context.adapterSettings.API_KEY
      return `${context.adapterSettings.WS_API_ENDPOINT}/iex`
    },

    handlers: {
      message(message) {
        if (!message?.data?.length || message.messageType !== 'A') {
          return []
        }
        return [
          {
            params: { ticker: message.data[tickerIndex] },
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
        return {
          eventName: 'subscribe',
          authorization: wsTransport.apiKey,
          eventData: { thresholdLevel: 5, tickers: [params.ticker] },
        }
      },
      unsubscribeMessage: (params) => {
        return {
          eventName: 'unsubscribe',
          authorization: wsTransport.apiKey,
          eventData: { thresholdLevel: 5, tickers: [params.ticker] },
        }
      },
    },
  })
