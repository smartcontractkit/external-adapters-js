import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { config } from '../../config'
import overrides from '../../config/overrides.json'
import { inputParameters } from '../../crypto-utils'
import { TiingoWebsocketTransport } from '../../ws-utils'

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

interface EPResponse {
  Result: null
  Data: {
    ticker: string
    datetime: string
    mid: number
    bid: number
    bidSize: number
    ask: number
    askSize: number
    weightedSpreadPcnt: number
  }
}

type EndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: EPResponse
  Provider: {
    WsMessage: Message
  }
}

export const wsTransport: TiingoWebsocketTransport<EndpointTypes> =
  new TiingoWebsocketTransport<EndpointTypes>({
    url: (context) => {
      wsTransport.apiKey = context.adapterSettings.API_KEY
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
          eventData: {
            thresholdLevel: 4,
            tickers: [`${params.base}/${params.quote}`],
          },
        }
      },
      unsubscribeMessage: (params) => {
        return {
          eventName: 'unsubscribe',
          authorization: wsTransport.apiKey,
          eventData: {
            thresholdLevel: 4,
            tickers: [`${params.base}/${params.quote}`],
          },
        }
      },
    },
  })

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'crypto-lwba',
  aliases: ['cryptolwba', 'crypto_lwba'],
  transport: wsTransport,
  inputParameters: inputParameters,
  overrides: overrides.tiingo,
})
