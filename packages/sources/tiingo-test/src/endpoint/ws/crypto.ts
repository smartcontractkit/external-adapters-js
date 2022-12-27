import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { customSettings } from '../../config'
import { PriceCryptoRequestParams } from '../../crypto-utils'

interface Message {
  service: string
  messageType: string
  data: [string, string, string, string, number]
}

const tickerIndex = 1
const priceIndex = 4

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
export const wsTransport = new WebSocketTransport<EndpointTypes>({
  url: (context) => {
    apiKey = context.adapterConfig.API_KEY
    return `${context.adapterConfig.WS_API_ENDPOINT}/crypto-synth`
  },

  handlers: {
    message(message) {
      if (!message?.data?.length || message.messageType !== 'A') {
        return []
      }
      const [base, quote] = message.data[tickerIndex].split('/')
      return [
        {
          params: { base, quote },
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
        eventData: { thresholdLevel: 6, tickers: [`${params.base}/${params.quote}`] },
      }
    },
    unsubscribeMessage: (params) => {
      return {
        eventName: 'unsubscribe',
        authorization: apiKey,
        eventData: { thresholdLevel: 6, tickers: [`${params.base}/${params.quote}`] },
      }
    },
  },
})
