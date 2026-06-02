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

const constructNobiSymbol = (params: { base: string; quote: string }): string => {
  return `Crypto:${params.base}/${params.quote}`
}

// This is what we want to do: an instance of the base websocket transport
export const buildNobiWsTransport = () =>
  new WebSocketTransport<WsTransportTypes>({
    url: (context) => context.adapterSettings.WS_API_ENDPOINT,
    options: (context) => ({
      headers: {
        'X-API-KEY': context.adapterSettings.API_KEY,
      },
    }),
    handlers: {
      // heartbeat msg sent at every WS_HEARTBEAT_INTERVAL_MS
      heartbeat: (connection) => {
        connection.send(
          JSON.stringify({
            method: 'ping',
          }),
        )
      },
      message: (message) => {
        // bypass messages like subscription response that don't have an asset_code, symbols, or price
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
        const dateMs = new Date(message.block_time)

        return [
          {
            params: {
              base: message.base_symbol,
              quote: message.quote_symbol,
            },
            response: {
              result,
              data: {
                result,
              },
              timestamps: {
                providerIndicatedTimeUnixMs: dateMs.getTime(),
              },
            },
          },
        ]
      },
    },
    builders: {
      // Nobi's WS API requires sending the full list of pairs to subscribe, keep track of activePairs
      batchSubscribeMessage: (params) => ({
        method: 'subscribe',
        params: {
          pairs: params.map((p) => constructNobiSymbol(p)),
        },
      }),
      // Nobi's API does not require sending the full list of pairs to unsubscribe, just the pairs to remove
      batchUnsubscribeMessage: (params) => ({
        method: 'unsubscribe',
        params: { pairs: params.map((p) => constructNobiSymbol(p)) },
      }),
    },
  })
