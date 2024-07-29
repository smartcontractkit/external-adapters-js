import { TiingoWebsocketTransport } from './utils'
import { BaseCryptoEndpointTypes } from '../endpoint/utils'

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

export const wsTransport: TiingoWebsocketTransport<WsTransportTypes> =
  new TiingoWebsocketTransport<WsTransportTypes>({
    url: (context) => {
      wsTransport.apiKey = context.adapterSettings.API_KEY
      return `${context.adapterSettings.WS_API_ENDPOINT}/crypto-synth`
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
        return {
          eventName: 'subscribe',
          authorization: wsTransport.apiKey,
          eventData: getEventData(params.base, params.quote),
        }
      },
      unsubscribeMessage: (params) => {
        return {
          eventName: 'unsubscribe',
          authorization: wsTransport.apiKey,
          eventData: getEventData(params.base, params.quote),
        }
      },
    },
  })

function getEventData(base: string, quote: string) {
  return {
    thresholdLevel: 6,
    baseCurrency: base,
    convertCurrency: quote,
    consolidateBaseCurrency: true,
  }
}
