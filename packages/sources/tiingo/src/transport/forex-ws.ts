import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/forex'
import { TiingoWebsocketReverseMappingTransport, wsMessageContent } from './utils'

const logger = makeLogger('TiingoWebsocketReverseMappingTransport')

interface Message {
  service: string
  messageType: string
  data: [string, string, string, string, string, number]
}

const tickerIndex = 1
const dateIndex = 2
const priceIndex = 5

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: Message
  }
}
export const wsTransport: TiingoWebsocketReverseMappingTransport<WsTransportTypes, string> =
  new TiingoWebsocketReverseMappingTransport<WsTransportTypes, string>({
    url: (context) => {
      wsTransport.apiKey = context.adapterSettings.API_KEY
      return `${context.adapterSettings.WS_API_ENDPOINT}/fx`
    },

    handlers: {
      close: (event) => {
        if (event.code != 1000) {
          logger.error('Possible issue with credentials')
          logger.error(`Possible Solution:
            1. Doublecheck your supplied credentials.
            2. Contact Data Provider to ensure your subscription is active
            3. If credentials are supplied under the node licensing agreement with Chainlink Labs, please make contact with us and we will look into it.`)
        }
      },
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
        return wsMessageContent('subscribe', wsTransport.apiKey, 5, params.base, params.quote, true)
      },
      unsubscribeMessage: (params) => {
        return wsMessageContent(
          'unsubscribe',
          wsTransport.apiKey,
          5,
          params.base,
          params.quote,
          true,
        )
      },
    },
  })
