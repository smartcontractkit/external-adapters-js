import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/stock'
import { toNumber } from './util'

export interface WSResponse {
  type: string
  channel: string
  asset: string
  symbol: string
  price: string
  size: string
  ts: number
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WSResponse
  }
}

const logger = makeLogger('StockTransport')

export const stockTradesType = 'trade'
export const stockTradesChannel = 'stocks.trades'
export const stockTradesAsset = 'stocks'

export class StockWebSocketTransport extends WebSocketTransport<WsTransportTypes> {
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
          const price = toNumber(message.price)
          const providerIndicatedTimeUnixMs = toNumber(message.ts)
          if (
            message.type !== stockTradesType ||
            message.channel !== stockTradesChannel ||
            message.asset !== stockTradesAsset ||
            !message.symbol ||
            !price ||
            !providerIndicatedTimeUnixMs
          ) {
            logger.warn({ msg: 'Ignoring unexpected message', ignoredMessage: message })
            return
          }

          const result = price
          return [
            {
              params: { base: message.symbol },
              response: {
                result,
                data: {
                  result,
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
            channels: [stockTradesChannel],
            symbols: [params.base],
          }
        },
        unsubscribeMessage: (params) => {
          return {
            action: 'unsubscribe',
            channels: [stockTradesChannel],
            symbols: [params.base],
          }
        },
      },
    })
  }
}

export const wsTransport = new StockWebSocketTransport()
