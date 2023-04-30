import { TiingoWebsocketTransport } from '../../ws-utils'
import { IEXEndpointTypes } from '../common/iex-router'

interface Message {
  service: string
  messageType: string
  data: [
    string,
    string,
    number,
    string,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ]
}

const dateIndex = 1
const tickerIndex = 3

const priceIndexMap = {
  lastTrade: 9,
  quote: 6,
}

const updateTypeMap = {
  lastTrade: 'T',
  quote: 'Q',
}

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
        const updateType = message.data[0]
        // Expects Last Trade (T) or Quote (Q) messages
        if (
          !message?.data?.length ||
          message.messageType !== 'A' ||
          (updateType !== updateTypeMap.lastTrade && updateType !== updateTypeMap.quote)
        ) {
          return []
        }

        let result: number
        if (updateType === updateTypeMap.lastTrade) {
          result = message.data[priceIndexMap.lastTrade] as number
        } else {
          result = message.data[priceIndexMap.quote] as number
        }
        return [
          {
            params: { ticker: message.data[tickerIndex] },
            response: {
              data: {
                result,
              },
              result,
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
