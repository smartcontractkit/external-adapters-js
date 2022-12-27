import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { customSettings } from '../../config'

interface Message {
  service: string
  messageType: string
  data: [string, string, string, string, string, number]
}

const tickerIndex = 3
const priceIndex = 5

type EndpointTypes = {
  Request: {
    Params: { ticker: string }
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    WsMessage: Message
  }
}

let apiKey = ''
export const wsTransport = new WebSocketTransport<EndpointTypes>({
  url: (context) => {
    apiKey = context.adapterConfig.API_KEY
    return `${context.adapterConfig.WS_API_ENDPOINT}/iex`
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
        authorization: apiKey,
        eventData: { thresholdLevel: 5, tickers: [params.ticker] },
      }
    },
    unsubscribeMessage: (params) => {
      return {
        eventName: 'unsubscribe',
        authorization: apiKey,
        eventData: { thresholdLevel: 5, tickers: [params.ticker] },
      }
    },
  },
})
