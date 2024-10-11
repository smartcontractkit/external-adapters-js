import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/price'

export interface WSResponse {
  blockTime: string
  baseSymbol: string
  quoteSymbol: string
  aggregatedStatePrice: string
  aggregatedStatePriceUSD: string
  aggregatedMarketDepthBaseToken: string
  aggregatedMarketDepthBaseTokenUSD: string
  aggregatedMarketDepthQuoteToken: string
  aggregatedMarketDepthQuoteTokenUSD: string
  totalTradingVolume: string
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WSResponse
  }
}
export const wsTransport = new WebSocketTransport<WsTransportTypes>({
  url: (context) => context.adapterSettings.WS_API_ENDPOINT,
  options: async (context) => ({
    headers: {
      authorization: 'secret-token',
      'x-api-key': context.adapterSettings.API_KEY,
    },
  }),
  handlers: {
    message(message) {
      if (!message.aggregatedStatePrice) {
        return
      }
      const result = Number(message.aggregatedStatePrice)
      const providerIndicatedTimeUnixMs = new Date(
        message.blockTime.split(' ').join('T').concat('Z'),
      ).getTime()
      return [
        {
          params: { base: message.baseSymbol, quote: message.quoteSymbol },
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
      const pair = `${params.base}/${params.quote}`.toUpperCase()
      return {
        action: 'liquiditymetrics',
        asset: pair,
      }
    },
  },
})
