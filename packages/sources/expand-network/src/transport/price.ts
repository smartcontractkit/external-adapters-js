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
export const wsTransport: WebsocketReverseMappingTransport<WsTransportTypes, string> =
  new WebsocketReverseMappingTransport<WsTransportTypes, string>({
    url: (context) => context.adapterSettings.WS_API_ENDPOINT,
    options: async (context) => ({
      headers: {
        authorization: 'secret-token',
        'x-api-key': context.adapterSettings.API_KEY,
      },
    }),
    handlers: {
      message(message) {
        const params = wsTransport.getReverseMapping(
          `${message.baseSymbol}/${message.quoteSymbol}`.toUpperCase(),
        )

        if (!params) {
          return [
            {
              params: { base: message.baseSymbol, quote: message.quoteSymbol },
              response: {
                errorMessage:
                  'No value received. Make sure the asset is supported and try again after a short delay.',
                statusCode: 500,
              },
            },
          ]
        }
        if (!message.aggregatedStatePrice) {
          return [
            {
              params,
              response: {
                errorMessage: 'Asset Not Supported!',
                statusCode: 500,
              },
            },
          ]
        }
        const result = Number(message.aggregatedStatePrice)
        const providerIndicatedTimeUnixMs = new Date(
          message.blockTime.split(' ').join('T').concat('Z'),
        ).getTime()
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
        const pair = `${params.base}/${params.quote}`.toUpperCase()
        wsTransport.setReverseMapping(pair, params)
        return {
          action: 'liquiditymetrics',
          asset: pair,
        }
      },
    },
  })
