import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/stock_quotes'

export interface WSResponse {
  type: string
  channel: string
  asset: string
  symbol: string
  bid: string
  ask: string
  bid_size: string
  ask_size: string
  ts: number
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WSResponse
  }
}

const logger = makeLogger('StockQuotesTransport')

const toNumber = (s?: string | number) => {
  const num = Number(s)
  return isNaN(num) ? undefined : num
}

export class StockQuotesWebSocketTransport extends WebSocketTransport<WsTransportTypes> {
  constructor() {
    super({
      url: (context) =>
        `${context.adapterSettings.WS_API_ENDPOINT}?apiKey=${context.adapterSettings.API_KEY}`,
      handlers: {
        message(message) {
          if (message.type === 'system') {
            logger.debug({ msg: 'Ignoring system message', ignoredMessage: message })
            return
          }
          const bid_price = toNumber(message.bid)
          const ask_price = toNumber(message.ask)
          const bid_volume = toNumber(message.bid_size)
          const ask_volume = toNumber(message.ask_size)
          const providerIndicatedTimeUnixMs = toNumber(message.ts)
          if (
            message.type !== 'quote' ||
            message.channel !== 'stocks.quotes' ||
            message.asset !== 'stocks' ||
            !message.symbol ||
            !bid_price ||
            !ask_price ||
            !bid_volume ||
            !ask_volume ||
            !providerIndicatedTimeUnixMs
          ) {
            logger.warn({ msg: 'Ignoring unexpected message', ignoredMessage: message })
            return
          }

          const mid_price = (bid_price + ask_price) / 2

          return [
            {
              params: { base: message.symbol },
              response: {
                result: null,
                data: {
                  mid_price,
                  bid_price,
                  ask_price,
                  bid_volume: Number(message.bid_size),
                  ask_volume: Number(message.ask_size),
                },
                timestamps: {
                  providerIndicatedTimeUnixMs: message.ts,
                },
              },
            },
          ]
        },
      },
      builders: {
        subscribeMessage: (params) => {
          return {
            action: 'subscribe',
            channels: ['stocks.quotes'],
            symbols: [params.base],
          }
        },
        unsubscribeMessage: (params) => {
          return {
            action: 'unsubscribe',
            channels: ['stocks.quotes'],
            symbols: [params.base],
          }
        },
      },
    })
  }
}

export const wsTransport = new StockQuotesWebSocketTransport()
