import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/price'

export interface WSResponse {
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

class NobiWsTransport extends WebSocketTransport<WsTransportTypes> {
  // activePairs keeps track of existing subscriptions
  activePairs = new Set<string>()
}

export const wsTransport = new NobiWsTransport({
  url: (context) => context.adapterSettings.WS_API_ENDPOINT,
  options: (context) => {
    return {
      headers: {
        'X-API-KEY': context.adapterSettings.API_KEY,
      },
    }
  },
  handlers: {
    heartbeat: (connection) => {
      connection.send(
        JSON.stringify({
          method: 'ping',
        }),
      )
    },
    message: (message) => {
      // bypass messages that don't have an asset_code or price. Eg: subscription response
      if (!message.asset_code || !message.price) {
        return
      }

      const result = Number(message.price)
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
    subscribeMessage: (params) => {
      const symbol = constructNobiSymbol(params)
      wsTransport.activePairs.add(symbol)
      const pairs: string[] = [...wsTransport.activePairs]
      console.log(`adding ${symbol}, pairs = ${pairs}`)
      return {
        method: 'subscribe',
        params: { pairs },
      }
    },
    unsubscribeMessage: (params) => {
      const symbol = constructNobiSymbol(params)
      wsTransport.activePairs.delete(symbol)
      const pairs: string[] = [...wsTransport.activePairs]
      console.log(`removing ${symbol}, remaining pairs = ${pairs}`)
      return {
        method: 'unsubscribe',
        params: { pairs: [symbol] },
      }
    },
  },
})
