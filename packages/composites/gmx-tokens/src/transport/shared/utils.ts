import { AdapterDataProviderError } from '@chainlink/external-adapter-framework/validation/error'
import Decimal from 'decimal.js'

export const SIGNED_PRICE_DECIMALS = 30

export type PriceData = { [asset: string]: { bids: number[]; asks: number[] } }

export type Source = { url: string; name: string }

export const median = (values: number[]): number => {
  if (values.length === 0) {
    throw new Error('Input array is empty')
  }

  const arr = [...values].sort((a, b) => a - b)
  const half = Math.floor(arr.length / 2)

  return arr.length % 2 ? arr[half] : (arr[half - 1] + arr[half]) / 2
}

export const toNumFromDS = (x: string | number, decimals: number): number => {
  return new Decimal(String(x)).div(`1e${decimals}`).toNumber()
}

export const toFixed = (number: number, decimals: number): string => {
  const n = new Decimal(number)
  return n
    .toFixed(SIGNED_PRICE_DECIMALS - decimals)
    .replace('.', '')
    .replace(/^0+/, '')
}

export interface Token {
  symbol: string
  address: string
  decimals: number
  synthetic?: null | boolean
}

export interface Market {
  marketToken: string
  indexToken: string
  longToken: string
  shortToken: string
  isListed: boolean
}

export const unwrapAsset = (asset: string): string => {
  if (asset === 'WBTC.b' || asset === 'stBTC') {
    return 'BTC'
  }
  if (asset === 'WETH') {
    return 'ETH'
  }
  if (asset === 'USDC.e') {
    return 'USDC'
  }
  return asset
}

export const dedupeAssets = <T extends { symbol: string }>(tokens: T[]): T[] => {
  const unique = new Map<string, T>()
  tokens.forEach((token) => {
    if (!unique.has(token.symbol)) {
      unique.set(token.symbol, token)
    }
  })
  return Array.from(unique.values())
}

export const calculateMedianPrices = (assets: string[], priceData: PriceData) => {
  return assets.map((asset) => {
    const medianBid = median([...new Set(priceData[asset].bids)])
    const medianAsk = median([...new Set(priceData[asset].asks)])
    return { asset, bid: medianBid, ask: medianAsk }
  })
}

export const validateRequiredResponses = (
  priceProviders: Record<string, string[]> = {},
  dataRequestedTimestamp: number,
) => {
  if (!Object.entries(priceProviders)?.length) {
    throw new AdapterDataProviderError(
      {
        statusCode: 502,
        message: `Missing responses from data-engine for all assets.`,
      },
      {
        providerDataRequestedUnixMs: dataRequestedTimestamp,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    )
  }
}
