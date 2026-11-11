import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/stock_quotes'
import { TiingoWebsocketTransport, wsMessageContent } from './utils'

const logger = makeLogger('TiingoStockQuotesFxWebsocketTransport')

// Tiingo publishes US index quotes (e.g. us30usd, us500usd, us100usd) on its FX feed rather than
// the equities feed, so stock_quotes requests for indices are served from here.
export interface Message {
  service: string
  messageType: string
  // ['Q', ticker, date, bidSize, bidPrice, midPrice, askSize, askPrice]
  data: [string, string, string, number, number, number, number, number]
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: Message
  }
}

// For index definitions see:
// https://www.tiingo.com/documentation/websockets/forex
const tickerIndex = 1
const dateIndex = 2
const bidPriceIndex = 4
const midPriceIndex = 5
const askPriceIndex = 7

// thresholdLevel 5 = top-of-book quote updates, same as the forex endpoint
const THRESHOLD_LEVEL = 5

const isValidPrice = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0

export class StockQuotesFxWebSocketTransport extends TiingoWebsocketTransport<WsTransportTypes> {
  constructor() {
    super({
      url: (context) => {
        fxWsTransport.apiKey = context.adapterSettings.API_KEY
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
          if (!message?.data?.length || message.messageType !== 'A') {
            return []
          }

          const ticker = message.data[tickerIndex]
          const bid_price = message.data[bidPriceIndex]
          const mid_price = message.data[midPriceIndex]
          const ask_price = message.data[askPriceIndex]

          if (
            typeof ticker !== 'string' ||
            !isValidPrice(mid_price) ||
            !isValidPrice(bid_price) ||
            !isValidPrice(ask_price)
          ) {
            logger.warn(
              `Received ${JSON.stringify(message)} with invalid ticker or bid/mid/ask price`,
            )
            return []
          }

          return [
            {
              params: { base: ticker.toLowerCase() },
              response: {
                data: {
                  mid_price,
                  bid_price,
                  // The FX feed reports a fixed placeholder size (1,000,000) rather than real
                  // liquidity, so volume is not meaningful for indices.
                  bid_volume: 0,
                  ask_price,
                  ask_volume: 0,
                },
                result: null,
                timestamps: {
                  providerIndicatedTimeUnixMs: new Date(message.data[dateIndex]).getTime(),
                },
              },
            },
          ]
        },
      },

      // base is already the full FX ticker (e.g. us30usd), so no quote is appended
      builders: {
        subscribeMessage: (params) =>
          wsMessageContent(
            'subscribe',
            fxWsTransport.apiKey,
            THRESHOLD_LEVEL,
            params.base,
            '',
            true,
          ),
        unsubscribeMessage: (params) =>
          wsMessageContent(
            'unsubscribe',
            fxWsTransport.apiKey,
            THRESHOLD_LEVEL,
            params.base,
            '',
            true,
          ),
      },
    })
  }
}

export const fxWsTransport = new StockQuotesFxWebSocketTransport()
