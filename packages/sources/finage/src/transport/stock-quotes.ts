import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/stock-quotes'

const logger = makeLogger('StockQuotes')

export interface StockQuoteMessage {
  s: string // Symbol
  a: string // ask_price
  ap: string // ask_price fallback
  as: string // ask_volume
  b: string // bid_price
  bp: string // bid_price fallback
  bs: string // bid_volume
  t: number // providerIndicatedTime
  status_code: number
  message: string
}

type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: StockQuoteMessage
  }
}

const isValidNumber = (field: string) => field && field.length > 0 && !isNaN(Number(field))

export const transport = new WebSocketTransport<WsTransportTypes>({
  url: (context) => {
    return `${context.adapterSettings.STOCK_QUOTES_WS_API_ENDPOINT}/?token=${context.adapterSettings.WS_SOCKET_KEY}`
  },
  handlers: {
    message(message) {
      if (message.status_code) {
        logger.info(`Received general message: ${JSON.stringify(message)}`)
        return []
      }
      if (!message.s || !isValidNumber(message.as) || !isValidNumber(message.bs)) {
        logger.warn(`Received ${JSON.stringify(message)} with invalid s or as or bs field.`)
        return []
      }
      if (!isValidNumber(message.b) && !isValidNumber(message.bp)) {
        logger.warn(`Received ${JSON.stringify(message)} with invalid b and bp fields.`)
        return []
      }
      if (!isValidNumber(message.a) && !isValidNumber(message.ap)) {
        logger.warn(`Received ${JSON.stringify(message)} with invalid a and ap fields.`)
        return []
      }

      return [
        {
          params: { base: message.s },
          response: {
            result: null,
            data: {
              bid_price: isValidNumber(message.b) ? Number(message.b) : Number(message.bp),
              bid_volume: Number(message.bs),
              ask_price: isValidNumber(message.a) ? Number(message.a) : Number(message.ap),
              ask_volume: Number(message.as),
            },
            timestamps: {
              providerIndicatedTimeUnixMs: message.t,
            },
          },
        },
      ]
    },
  },

  builders: {
    subscribeMessage: (params) => {
      return { action: 'subscribe', symbols: `${params.base}`.toUpperCase() }
    },
    unsubscribeMessage: (params) => {
      return { action: 'unsubscribe', symbols: `${params.base}`.toUpperCase() }
    },
  },
})
