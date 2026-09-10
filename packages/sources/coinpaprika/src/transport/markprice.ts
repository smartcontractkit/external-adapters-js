import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import Decimal from 'decimal.js'
import {
  BaseEndpointTypes,
  legacyTopOfBookEvents,
  markPriceEvents,
  topOfBookEvents,
} from '../endpoint/markprice'

export const toWsEventType = (type: string): string =>
  type === 'mark_price_index' ? 'mark_price' : type

const toNumber = (s?: string): number | undefined =>
  s && !isNaN(Number(s)) ? Number(s) : undefined

type WsMessage = {
  event: string
  data: {
    id: string
    exchange: string
    symbol: string
    price: string
    index_price?: string
    bid_price: string
    ask_price: string
    timestamp: string // "2026-03-12T15:24:40Z"
  }
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WsMessage
  }
}

const logger = makeLogger('markprice')

let subscriptions: TypeFromDefinition<BaseEndpointTypes['Parameters']>[] = []

export const wsTransport = new WebSocketTransport<WsTransportTypes>({
  url: (context, desiredSubs) => {
    subscriptions = desiredSubs ?? []
    return context.adapterSettings.WS_MARK_PRICE_API_ENDPOINT
  },
  options: async (context) => ({
    headers: {
      Authorization: context.adapterSettings.API_KEY,
    },
  }),
  handlers: {
    message(message: WsMessage) {
      if (
        !message ||
        !message.event ||
        !message.data ||
        !message.data.exchange ||
        !message.data.symbol ||
        !message.data.timestamp
      ) {
        logger.warn(`Received invalid message: ${JSON.stringify(message)}`)
        return
      }

      // Normalize the event type for subscription matching:
      // The API sends 'top_of_book' for perps, but subscriptions store 'top_of_book_perps'
      // after requestTransforms normalize the legacy alias.
      const normalizedEventType = legacyTopOfBookEvents.includes(message.event)
        ? 'top_of_book_perps'
        : message.event

      // Normalize the symbol for the subscription matching:
      // The API may send back mixed case symbols eg: xyz:SILVER
      const normalizedSymbol = message.data.symbol.toUpperCase()

      if (
        !subscriptions.some(
          (s) =>
            s.exchange === message.data.exchange &&
            s.symbol === normalizedSymbol &&
            toWsEventType(s.type) === normalizedEventType,
        )
      ) {
        // Skip unsubscribed messages
        return
      }

      const params = {
        exchange: message.data.exchange,
        symbol: normalizedSymbol,
        type: normalizedEventType,
      }
      const timestamps = {
        providerIndicatedTimeUnixMs: new Date(message.data.timestamp).getTime(),
      }

      if (markPriceEvents.includes(normalizedEventType)) {
        const result: ProviderResult<WsTransportTypes>[] = []
        const price = toNumber(message.data.price)
        if (price !== undefined) {
          result.push({
            params: { ...params },
            response: {
              result: price,
              data: {
                mid: price,
              },
              timestamps,
            },
          })
        }
        const indexPrice = toNumber(message.data.index_price)
        if (indexPrice !== undefined) {
          result.push({
            params: {
              ...params,
              type: 'mark_price_index',
            },
            response: {
              result: indexPrice,
              data: {
                index_price: indexPrice,
              },
              timestamps,
            },
          })
        }
        if (result.length > 0) {
          return result
        }
      }

      if (
        topOfBookEvents.includes(normalizedEventType) &&
        message.data.bid_price &&
        message.data.ask_price &&
        !isNaN(Number(message.data.bid_price)) &&
        !isNaN(Number(message.data.ask_price))
      ) {
        const bidDecimal = new Decimal(message.data.bid_price)
        const askDecimal = new Decimal(message.data.ask_price)
        const mid = bidDecimal.add(askDecimal).div(2).toNumber()
        return [
          {
            params: { ...params },
            response: {
              result: mid,
              data: {
                mid,
                bid: Number(message.data.bid_price),
                ask: Number(message.data.ask_price),
              },
              timestamps,
            },
          },
        ]
      }

      logger.warn(`Received message with wrong price fields: ${JSON.stringify(message)}`)
      return
    },
  },
})
