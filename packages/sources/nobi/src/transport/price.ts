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

export class NobiWsTransport extends WebSocketTransport<WsTransportTypes> {
  // activePairs keeps track of existing subscriptions
  activePairs = new Set<string>()

  constructor() {
    super({
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
        subscribeMessage: (params) => {
          const symbol = constructNobiSymbol(params)
          this.activePairs.add(symbol)
          const pairs: string[] = [...this.activePairs]
          logger.debug(`adding ${symbol}, pairs = ${pairs}`)
          return {
            method: 'subscribe',
            params: { pairs },
          }
        },
        // Nobi's API does not require sending the full list of pairs to unsubscribe, just the pairs to remove
        unsubscribeMessage: (params) => {
          const symbol = constructNobiSymbol(params)
          this.activePairs.delete(symbol)
          const pairs: string[] = [...this.activePairs]
          logger.debug(`removing ${symbol}, remaining pairs = ${pairs}`)
          return {
            method: 'unsubscribe',
            params: { pairs: [symbol] },
          }
        },
      },
    })
  }
}
