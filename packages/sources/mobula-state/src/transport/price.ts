import { WebsocketReverseMappingTransport } from '@chainlink/external-adapter-framework/transports'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import includes from '../config/includes.json'
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

// Interface for Mobula WebSocket subscription message
interface MobulaSubscribeMessage {
  type: 'feed'
  authorization: string
  kind: 'asset_ids'
  asset_ids: number[]
  quote_id?: number
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WSResponse
  }
}

// Build a lookup map for symbol-to-asset-ID from includes.json
// This is used for base symbol resolution
const buildSymbolToAssetIdMap = (): Record<string, number> => {
  const map: Record<string, number> = {}
  for (const entry of includes) {
    const symbol = entry.from.toUpperCase()
    const assetId = Number.parseInt(entry.includes[0].from, 10)
    if (!Number.isNaN(assetId)) {
      map[symbol] = assetId
    }
  }
  return map
}

const SYMBOL_TO_ASSET_ID = buildSymbolToAssetIdMap()

// Hardcoded quote currency asset IDs
// These are commonly used quotes that don't need includes.json entries
const QUOTE_ASSET_IDS: Record<string, number> = {
  BTC: 100001656, // Bitcoin
  ETH: 100004304, // Ethereum
  SOL: 100010811, // Solana
  HYPE: 102498883, // Hyperliquid
  S: 102501606, // Sonic (using 'S' as symbol)
  BBSOL: 102484775, // Bybit Staked SOL
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

// Map quote symbols to IDs
// Returns: number for crypto quotes, 'USD' string for USD, or throws for unmapped symbols
const getQuoteId = (quote: string): number | 'USD' => {
  const upperQuote = quote.toUpperCase()

  // USD doesn't need a numeric quote_id in the API, return string for composite key
  if (upperQuote === 'USD') {
    return 'USD'
  }

  // Check hardcoded quote mappings first (common crypto quotes)
  const hardcodedId = QUOTE_ASSET_IDS[upperQuote]
  if (hardcodedId) {
    return hardcodedId
  }

  // Check if quote is already a number (asset ID)
  const parsed = Number.parseInt(quote, 10)
  if (!Number.isNaN(parsed)) {
    return parsed
  }

  // Look up quote symbol in includes.json-derived map (for less common quotes)
  const assetId = SYMBOL_TO_ASSET_ID[upperQuote]
  if (assetId) {
    return assetId
  }

  // If not found, throw error
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
        const compositeKey = `${assetId}-${quoteId}`
        wsTransport.setReverseMapping(compositeKey, params)

        const subscribeMsg: MobulaSubscribeMessage = {
          type: 'feed',
          authorization: context.adapterSettings.API_KEY,
          kind: 'asset_ids',
          asset_ids: [assetId],
        }

        // Only add quote_id to API message for non-USD quotes
        if (quoteId !== 'USD') {
          subscribeMsg.quote_id = quoteId
        }

        return subscribeMsg
      },
      unsubscribeMessage: () => undefined,
    },
  })
