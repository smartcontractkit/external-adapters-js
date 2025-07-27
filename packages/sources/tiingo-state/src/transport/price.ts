import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseCryptoEndpointTypes } from '../endpoint/price'
import { wsMessageContent } from './utils'

interface Message {
  service: string
  messageType: string
  data: [string, string, string, string, number]
}

const tickerIndex = 1
const dateIndex = 2
const priceIndex = 4

type WsTransportTypes = BaseCryptoEndpointTypes & {
  Provider: {
    WsMessage: Message
  }
}

export const wsTransport = new WebSocketTransport<WsTransportTypes>({
  url: (context) => {
    return `${context.adapterSettings.WS_API_ENDPOINT}/crypto-synth-state`
  },

  handlers: {
    message(message) {
      if (!message?.data?.length || message.messageType !== 'A' || !message.data[priceIndex]) {
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
            timestamps: {
              providerIndicatedTimeUnixMs: new Date(message.data[dateIndex]).getTime(),
            },
          },
        },
      ]
    },
  },

  builders: {
    subscribeMessage: (params, context) => {
      return wsMessageContent(
        'subscribe',
        context.adapterSettings.API_KEY,
        8,
        params.base,
        params.quote,
      )
    },
    unsubscribeMessage: (params, context) => {
      return wsMessageContent(
        'unsubscribe',
        context.adapterSettings.API_KEY,
        8,
        params.base,
        params.quote,
      )
    },
  },
})
