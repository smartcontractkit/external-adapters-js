import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/stock_quotes'
import { TiingoWebsocketTransport } from './utils'

const logger = makeLogger('TiingoStockQuotesWebsocketTransport')

export interface Message {
  service: string
  messageType: string
  data: [string, string, number, number, number, number, number, number]
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: Message
  }
}

// For index definitions see:
// https://www.tiingo.com/documentation/websockets/equity-realtime-stock-data
const dateIndex = 0
const tickerIndex = 1
// const liquiditySpreadIndex = 2
const liquidityBidSizeIndex = 3
const liquidityBidPriceIndex = 4
// const referencePriceIndex = 5
const liquidityAskPriceIndex = 6
const liquidityAskSizeIndex = 7

/*
Tiingo EA currently does not receive asset prices during off-market hours. When a heartbeat message is received during these hours,
we update the TTL of cache entries that EA is requested to provide a price during off-market hours.
*/
const updateTTL = async (transport: TiingoWebsocketTransport<WsTransportTypes>, ttl: number) => {
  const params = await transport.subscriptionSet.getAll()
  transport.responseCache.writeTTL(transport.name, params, ttl)
}

export class StockQuotesWebSocketTransport extends TiingoWebsocketTransport<WsTransportTypes> {
  constructor() {
    super({
      url: (context) => {
        wsTransport.apiKey = context.adapterSettings.API_KEY
        return `${context.adapterSettings.WS_API_ENDPOINT}/equity/intraday`
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
          const bid_price = message.data[liquidityBidPriceIndex]
          const bid_volume = message.data[liquidityBidSizeIndex]
          const ask_price = message.data[liquidityAskPriceIndex]
          const ask_volume = message.data[liquidityAskSizeIndex]

          let mid_price = 0
          if (!bid_price && !ask_price) {
            return []
          } else if (!bid_price) {
            mid_price = ask_price
          } else if (!ask_price) {
            mid_price = bid_price
          } else {
            mid_price = (bid_price + ask_price) / 2
          }

          return [
            {
              params: { base: ticker },
              response: {
                data: {
                  mid_price,
                  bid_price,
                  bid_volume,
                  ask_price,
                  ask_volume,
                },
                result: null,
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
              thresholdLevel: 4,
              tickers: [params.base.toLowerCase()],
            },
          }
        },
        unsubscribeMessage: (params) => {
          return {
            eventName: 'unsubscribe',
            authorization: wsTransport.apiKey,
            eventData: {
              thresholdLevel: 4,
              tickers: [params.base.toLowerCase()],
            },
          }
        },
      },
    })
  }
}

export const wsTransport = new StockQuotesWebSocketTransport()
