import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/stock'

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
          if (
            message.type !== 'trade' ||
            message.channel !== 'stocks.trades' ||
            message.asset !== 'stocks' ||
            !message.symbol ||
            !message.price ||
            isNaN(Number(message.price)) ||
            !message.ts ||
            isNaN(Number(message.ts))
          ) {
            logger.warn({ msg: 'Ignoring unexpected message', ignoredMessage: message })
            return
          }

          const result = Number(message.price)
          return [
            {
              params: { base: message.symbol },
              response: {
                result,
                data: {
                  result,
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
            channels: ['stocks.trades'],
            symbols: [params.base],
          }
        },
        unsubscribeMessage: (params) => {
          return {
            action: 'unsubscribe',
            channels: ['stocks.trades'],
            symbols: [params.base],
          }
        },
      },
    })
  }
}

export const wsTransport = new StockWebSocketTransport()
