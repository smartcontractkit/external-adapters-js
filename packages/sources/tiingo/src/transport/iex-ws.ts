import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { BaseEndpointTypes } from '../endpoint/iex'
import { TiingoWebsocketTransport } from './utils'

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

type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: Message
  }
}

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
      message(message, context) {
        // Check for a heartbeat message, refresh the TTLs of all requested entries in the cache
        if (message.messageType === 'H') {
          wsTransport.lastMessageReceivedAt = Date.now()
          updateTTL(wsTransport, context.adapterSettings.CACHE_MAX_AGE)
          return []
        }

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
            params: { base: message.data[tickerIndex] },
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
          eventData: { thresholdLevel: 5, tickers: [params.base] },
        }
      },
      unsubscribeMessage: (params) => {
        return {
          eventName: 'unsubscribe',
          authorization: wsTransport.apiKey,
          eventData: { thresholdLevel: 5, tickers: [params.base] },
        }
      },
    },
  })
