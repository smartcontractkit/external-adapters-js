import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/stock_quotes'
import { toNumber } from './util'

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

export const stockQuotesType = 'quote'
export const stockQuotesChannel = 'stocks.quotes'
export const stockQuotesAsset = 'stocks'

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
            message.type !== stockQuotesType ||
            message.channel !== stockQuotesChannel ||
            message.asset !== stockQuotesAsset ||
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
                  bid_volume,
                  ask_volume,
                },
                timestamps: {
                  providerIndicatedTimeUnixMs,
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
            channels: [stockQuotesChannel],
            symbols: [params.base],
          }
        },
        unsubscribeMessage: (params) => {
          return {
            action: 'unsubscribe',
            channels: [stockQuotesChannel],
            symbols: [params.base],
          }
        },
      },
    })
  }
}

export const wsTransport = new StockQuotesWebSocketTransport()
