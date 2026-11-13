import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util/logger'
import { BaseEndpointTypes } from '../endpoint/price'

const logger = makeLogger('NobiWsTransport')

export type WSResponse = {
  asset_code: string
  block_time: string
  price: string
  base_symbol: string
  quote_symbol: string
  depth_usd_plus: string
  depth_usd_min: string
  volume_7d_usd: string
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WSResponse
  }
}

const constructNobiSymbol = (params: { base: string; quote: string }): string =>
  `Crypto:${params.base}/${params.quote}`

export const buildNobiWsTransport = () =>
  new WebSocketTransport<WsTransportTypes>({
    url: (context) => context.adapterSettings.WS_API_ENDPOINT,
    options: (context) => ({
      headers: {
        'X-API-KEY': context.adapterSettings.API_KEY,
      },
    }),
    handlers: {
      heartbeat: (connection) => {
        connection.send(JSON.stringify({ method: 'ping' }))
      },
      message: (message) => {
        if (
          !message.asset_code ||
          !message.price ||
          !message.base_symbol ||
          !message.quote_symbol
        ) {
          return
        }

        const result = Number(message.price)
        if (isNaN(result)) {
          logger.warn(`Received non-numeric price for ${message.asset_code}: ${message.price}`)
          return
        }

        return [
          {
            params: {
              base: message.base_symbol,
              quote: message.quote_symbol,
            },
            response: {
              result,
              data: { result },
              timestamps: {
                providerIndicatedTimeUnixMs: new Date(message.block_time).getTime(),
              },
            },
          },
        ]
      },
    },
    builders: {
      customSubscriptionMessages: (_context, subscriptions) => {
        const messages: unknown[] = []

        if (subscriptions.new.length > 0) {
          messages.push({
            method: 'subscribe',
            params: { pairs: subscriptions.desired.map(constructNobiSymbol) },
          })
        }

        if (subscriptions.stale.length > 0) {
          messages.push({
            method: 'unsubscribe',
            params: { pairs: subscriptions.stale.map(constructNobiSymbol) },
          })
        }

        return messages
      },
    },
  })
