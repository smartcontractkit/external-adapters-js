import Decimal from 'decimal.js'

// The signed prices represent the price of one unit of the token using a value with 30 decimals of precision.
export const SIGNED_PRICE_DECIMALS = 30

export type PriceData = { [asset: string]: { bids: number[]; asks: number[] } }

export type Source = { url: string; name: string }

export const median = (values: number[]): number => {
  if (values.length === 0) {
    throw new Error('Input array is empty')
  }

  values = [...values].sort((a, b) => a - b)

  const half = Math.floor(values.length / 2)

  return values.length % 2 ? values[half] : (values[half - 1] + values[half]) / 2
}

/*
Formats a given number with a specified precision without leading zeros and decimal point.
Price decimals = SIGNED_PRICE_DECIMALS - token decimals

toFixed(14.84329267, 6) -> '14843292670000'
toFixed(0.99999558, 18) -> '999995580000000000000000'
 */
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
  synthetic: null | boolean
}

export interface Market {
  marketToken: string
  indexToken: string
  longToken: string
  shortToken: string
  isListed: boolean
}

export function mapSymbol(address: string, symbolMap: Record<string, any>) {
  return symbolMap[address]
}

export const unsupportedAssets: Record<string, string[]> = {
  coinmetrics: ['TAO'],
  tiingo: ['FLOKI'],
  ncfx: [],
}
