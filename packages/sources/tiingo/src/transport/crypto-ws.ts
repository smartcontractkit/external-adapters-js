import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseCryptoEndpointTypes } from '../endpoint/utils'
import { TiingoWebsocketTransport, wsMessageContent } from './utils'

const logger = makeLogger('TiingoWebsocketTransport')

interface Message {
  service: string
  messageType: string
  data: [string, string, string, string, number]
  response: {
    code: number
    message: string
  }
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
          if (message.response.message === 'authorization failed') {
            logger.error(`Authorization failed`)
            logger.error(`Possible Solution:
              1. Doublecheck your supplied credentials.
              2. Contact Data Provider to ensure your subscription is active
              3. If credentials are supplied under the node licensing agreement with Chainlink Labs, please make contact with us and we will look into it.`)
          }
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
        return wsMessageContent('subscribe', wsTransport.apiKey, 6, params.base, params.quote)
      },
      unsubscribeMessage: (params) => {
        return wsMessageContent('unsubscribe', wsTransport.apiKey, 6, params.base, params.quote)
      },
    },
  })
