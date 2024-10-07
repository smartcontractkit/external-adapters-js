import { WebsocketReverseMappingTransport } from '@chainlink/external-adapter-framework/transports'
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
export const wsTransport = new WebsocketReverseMappingTransport<WsTransportTypes, string>({
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
      const pair = `${message.baseSymbol}/${message.quoteSymbol}`.toUpperCase()
      const params = wsTransport.getReverseMapping(pair)
      if (!params) {
        return
      }
      const result = Number(message.aggregatedStatePrice)
      const providerIndicatedTimeUnixMs = new Date(message.blockTime).getTime()
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
      wsTransport.setReverseMapping(pair, params)
      return {
        action: 'liquiditymetrics',
        asset: pair,
      }
    },
  },
})
