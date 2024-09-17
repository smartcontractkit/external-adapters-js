import { WebsocketReverseMappingTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/price'

export interface WSResponse {
  type: string
  symbol: string
  changes: [buySell: string, price: string, quantity: string][]
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WSResponse
  }
}
export const wsTransport: WebsocketReverseMappingTransport<WsTransportTypes, string> =
  new WebsocketReverseMappingTransport<WsTransportTypes, string>({
    url: (context) => context.adapterSettings.WS_API_ENDPOINT,
    handlers: {
      message(message) {
        const providerIndicatedTimeUnixMs = Date.now()
        if (message.type !== 'l2_updates') {
          return
        }
        const params = wsTransport.getReverseMapping(message.symbol)
        if (!params) {
          return
        }
        const result = Number(message.changes[0][1])
        return [
          {
            params,
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
        const pair = `${params.base}${params.quote}`.toUpperCase()
        wsTransport.setReverseMapping(pair, params)
        return {
          type: 'subscribe',
          subscriptions: [{ name: 'l2', symbols: [pair] }],
        }
      },
      unsubscribeMessage: (params) => {
        const pair = `${params.base}${params.quote}`.toUpperCase()
        return {
          type: 'unsubscribe',
          subscriptions: [{ name: 'l2', symbols: [pair] }],
        }
      },
    },
  })
