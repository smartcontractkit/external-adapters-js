import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/iex'
import { TiingoWebsocketTransport } from './utils'

const logger = makeLogger('TiingoWebsocketTransport')

interface Message {
  service: string
  messageType: string
  data: [string, string, number]
}

type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: Message
  }
}

const dateIndex = 0
const tickerIndex = 1
const priceIndex = 2

/*
Tiingo EA currently does not receive asset prices during off-market hours. When a heartbeat message is received during these hours,
we update the TTL of cache entries that EA is requested to provide a price during off-market hours.
*/
const updateTTL = async (transport: WebSocketTransport<WsTransportTypes>, ttl: number) => {
  const params = await transport.subscriptionSet.getAll()
  transport.responseCache.writeTTL(transport.name, params, ttl)
}

export const wsTransport: TiingoWebsocketTransport<WsTransportTypes> =
  new TiingoWebsocketTransport<WsTransportTypes>({
    url: (context) => {
      wsTransport.apiKey = context.adapterSettings.API_KEY
      return `${context.adapterSettings.WS_API_ENDPOINT}/iex`
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
      message(message, context) {
        // Check for a heartbeat message, refresh the TTLs of all requested entries in the cache
        if (message.messageType === 'H') {
          wsTransport.lastMessageReceivedAt = Date.now()
          updateTTL(wsTransport, context.adapterSettings.CACHE_MAX_AGE)
          return []
        }

        if (!message?.data?.length || message.messageType !== 'A') {
          return []
        }

        const dateString = message.data[dateIndex]
        const ticker = message.data[tickerIndex]
        const result = message.data[priceIndex]

        return [
          {
            params: { base: ticker },
            response: {
              data: {
                result,
              },
              result,
              timestamps: {
                providerIndicatedTimeUnixMs: new Date(dateString).getTime(),
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
            thresholdLevel: 6,
            tickers: [params.base.toLowerCase()],
          },
        }
      },
      unsubscribeMessage: (params) => {
        return {
          eventName: 'unsubscribe',
          authorization: wsTransport.apiKey,
          eventData: {
            thresholdLevel: 6,
            tickers: [params.base.toLowerCase()],
          },
        }
      },
    },
  })
