import { TiingoWebsocketTransport } from './utils'
import { BaseEndpointTypes } from '../endpoint/crypto-lwba'

interface Message {
  service: string
  messageType: string
  data: [string, string, string, string, number, number, number, number, number, number]
}

const dataKeys = {
  messageType: 0,
  ticker: 1,
  datetime: 2,
  exchange: 3,
  weightedMidPrice: 4,
  weightedSpreadPcnt: 5,
  bidSize: 6,
  bidPrice: 7,
  askSize: 8,
  askPrice: 9,
} as const

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: Message
  }
}
export const transport: TiingoWebsocketTransport<WsTransportTypes> =
  new TiingoWebsocketTransport<WsTransportTypes>({
    url: (context) => {
      transport.apiKey = context.adapterSettings.API_KEY
      return `${context.adapterSettings.WS_API_ENDPOINT}/crypto-synth-top`
    },

    handlers: {
      message(message) {
        if (!message?.data?.length || message.messageType !== 'A') {
          return []
        }
        const [base, quote] = message.data[dataKeys.ticker].split('/')
        return [
          {
            params: { base, quote },
            response: {
              result: null,
              data: {
                ticker: message.data[dataKeys.ticker],
                datetime: message.data[dataKeys.datetime],
                mid: message.data[dataKeys.weightedMidPrice],
                bid: message.data[dataKeys.bidPrice],
                bidSize: message.data[dataKeys.bidSize],
                ask: message.data[dataKeys.askPrice],
                askSize: message.data[dataKeys.askSize],
                weightedSpreadPcnt: message.data[dataKeys.weightedSpreadPcnt],
              },
              timestamps: {
                providerIndicatedTimeUnixMs: new Date(message.data[dataKeys.datetime]).valueOf(),
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
          authorization: transport.apiKey,
          eventData: {
            thresholdLevel: 4,
            tickers: [`${params.base}/${params.quote}`],
          },
        }
      },
      unsubscribeMessage: (params) => {
        return {
          eventName: 'unsubscribe',
          authorization: transport.apiKey,
          eventData: {
            thresholdLevel: 4,
            tickers: [`${params.base}/${params.quote}`],
          },
        }
      },
    },
  })
