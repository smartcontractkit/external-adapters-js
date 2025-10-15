import { WebsocketReverseMappingTransport } from '@chainlink/external-adapter-framework/transports'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/price'

export interface WSResponse {
  timestamp: number
  price: number
  marketDepthUSDUp: number
  marketDepthUSDDown: number
  volume24h: number
  baseSymbol: string
  quoteSymbol: string
  baseID: string
  quoteID: string
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WSResponse
  }
}

// Get asset ID from the resolved symbol (after framework includes are applied)
const getAssetId = (symbol: string): number => {
  const parsed = Number.parseInt(symbol, 10)

  if (!Number.isNaN(parsed)) {
    return parsed
  }

  throw new Error(
    `Unable to resolve asset ID for symbol: ${symbol}. Please ensure includes.json is configured for this symbol.`,
  )
}

// Map quote symbols to IDs - USD doesn't need quote_id, others do
const getQuoteId = (quote: string): number | undefined => {
  if (quote.toUpperCase() === 'USD') {
    return undefined // USD works without quote_id
  }

  // Check if quote is already a number (asset ID)
  const parsed = Number.parseInt(quote, 10)
  if (!Number.isNaN(parsed)) {
    return parsed
  }

  // For now, if it's not USD and not a number, we need includes.json mapping
  // The framework should have applied includes mapping by this point
  throw new Error(
    `Unable to resolve quote ID for symbol: ${quote}. Please ensure includes.json is configured for this quote currency.`,
  )
}

export const wsTransport: WebsocketReverseMappingTransport<WsTransportTypes, string> =
  new WebsocketReverseMappingTransport<WsTransportTypes, string>({
    url: (context) => context.adapterSettings.WS_API_ENDPOINT,
    handlers: {
      message: (message): ProviderResult<WsTransportTypes>[] => {
        if (!message.price) {
          return []
        }

        // Get original user params using reverse mapping with baseID only
        const params = wsTransport.getReverseMapping(message.baseID)
        if (!params) {
          return []
        }

        return [
          {
            params, // Use exact original params user sent
            response: {
              result: message.price,
              data: { result: message.price },
              timestamps: { providerIndicatedTimeUnixMs: message.timestamp },
            },
          },
        ]
      },
    },
    builders: {
      subscribeMessage: (params, context) => {
        const assetId = getAssetId(params.base)
        const quoteId = getQuoteId(params.quote)

        // Store mapping: baseID -> original user params
        wsTransport.setReverseMapping(String(assetId), params)

        const subscribeMsg: any = {
          type: 'feed',
          authorization: context.adapterSettings.API_KEY,
          kind: 'asset_ids',
          asset_ids: [assetId],
        }

        if (quoteId !== undefined) {
          subscribeMsg.quote_id = quoteId
        }

        return subscribeMsg
      },
      unsubscribeMessage: () => undefined,
    },
  })
