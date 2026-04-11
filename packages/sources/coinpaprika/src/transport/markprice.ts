import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { BaseEndpointTypes, topOfBookEvents } from '../endpoint/markprice'

type WsMessage = {
  event: string
  data: {
    id: string
    exchange: string
    symbol: string
    price: string
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

      if (
        !subscriptions.some(
          (s) =>
            s.exchange === message.data.exchange &&
            s.symbol === message.data.symbol &&
            s.type === message.event,
        )
      ) {
        // Skip unsubscribed messages
        return
      }

      const params = {
        exchange: message.data.exchange,
        symbol: message.data.symbol,
      }
      const timestamps = {
        providerIndicatedTimeUnixMs: new Date(message.data.timestamp).getTime(),
      }

      if (
        message.event === 'mark_price' &&
        message.data.price &&
        !isNaN(Number(message.data.price))
      ) {
        return [
          {
            params: { ...params, type: message.event },
            response: {
              result: Number(message.data.price),
              data: {
                mid: Number(message.data.price),
              },
              timestamps,
            },
          },
        ]
      }

      if (
        topOfBookEvents.includes(message.event) &&
        message.data.bid_price &&
        message.data.ask_price &&
        !isNaN(Number(message.data.bid_price)) &&
        !isNaN(Number(message.data.ask_price))
      ) {
        const mid = (Number(message.data.bid_price) + Number(message.data.ask_price)) / 2
        return [
          {
            params: { ...params, type: message.event },
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
