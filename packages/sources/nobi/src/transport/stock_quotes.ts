import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util/logger'
import { BaseEndpointTypes } from '../endpoint/stock_quotes'
import { customSubscriptionMessages, heartbeat } from './common'

const logger = makeLogger('NobiStockQuotesTransport')

export type WSResponse = {
  code: string // Example: "Equity:US:AAPL/USD"
  ask: string
  bid: string
  price: string
  last_updated: number
  sent_at: number
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WSResponse
  }
}

export const buildQuoteTransport = () =>
  new WebSocketTransport<WsTransportTypes>({
    url: (context) => context.adapterSettings.QUOTES_API_ENDPOINT,
    options: (context) => ({
      headers: {
        'X-API-KEY': context.adapterSettings.QUOTES_API_KEY,
      },
    }),
    handlers: {
      heartbeat,
      message: (message) => {
        if (!message.code || !message.ask || !message.bid || !message.price) {
          return
        }
        if (
          isNaN(Number(message.ask)) ||
          isNaN(Number(message.bid)) ||
          isNaN(Number(message.price))
        ) {
          logger.warn(`Received non-numeric price in message: ${JSON.stringify(message)}`)
          return
        }

        const base = message.code.split('/')[0]
        const quote = message.code.split('/')[1]
        if (!base || !quote) {
          logger.warn(`Received invalid base or quote in message: ${message.code}`)
          return
        }

        return [
          {
            params: {
              base,
              quote,
            },
            response: {
              result: null,
              data: {
                mid_price: Number(message.price),
                bid_price: Number(message.bid),
                ask_price: Number(message.ask),
              },
              timestamps: {
                providerIndicatedTimeUnixMs: new Date(message.last_updated).getTime(),
              },
            },
          },
        ]
      },
    },
    builders: {
      customSubscriptionMessages: (_, subscriptions) =>
        customSubscriptionMessages(subscriptions, buildPair),
    },
  })

const buildPair = (params: { base: string; quote: string }): string =>
  `${params.base}/${params.quote}`
