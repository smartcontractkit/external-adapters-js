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

// Hardcoded quote currency asset IDs
const QUOTE_ASSET_IDS: Record<string, number> = {
  BTC: 100001656, // Bitcoin
  ETH: 100004304, // Ethereum
  SOL: 100010811, // Solana
  HYPE: 102498883, // Hyperliquid
  S: 102501606, // Sonic (using 'S' as symbol)
  BBSOL: 102484775, // Bybit Staked SOL
}

// Map quote symbols to IDs - USD doesn't need quote_id, others do
const getQuoteId = (quote: string): number | undefined => {
  if (quote.toUpperCase() === 'USD') {
    return undefined // USD works without quote_id
  }

  // Check hardcoded quote mappings first
  const hardcodedId = QUOTE_ASSET_IDS[quote.toUpperCase()]
  if (hardcodedId) {
    return hardcodedId
  }

  // Check if quote is already a number (asset ID)
  const parsed = Number.parseInt(quote, 10)
  if (!Number.isNaN(parsed)) {
    return parsed
  }

  // If not found in hardcoded mappings and not a number, check includes.json
  // The framework should have applied includes mapping by this point
  throw new Error(
    `Unable to resolve quote ID for symbol: ${quote}. Please ensure includes.json is configured for this quote currency or add it to QUOTE_ASSET_IDS.`,
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

        // Use composite key for reverse mapping: baseID-quoteID
        const compositeKey = `${message.baseID}-${message.quoteID}`
        const params = wsTransport.getReverseMapping(compositeKey)
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

        // Store mapping using composite key: baseID-quoteID -> original user params
        const compositeKey = `${assetId}-${quoteId || 'USD'}`
        wsTransport.setReverseMapping(compositeKey, params)

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
