import Decimal from 'decimal.js'

// The signed prices represent the price of one unit of the token using a value with 30 decimals of precision.
export const SIGNED_PRICE_DECIMALS = 30

export type PriceData = { [asset: string]: { bids: number[]; asks: number[] } }

export type Source = { url: string; name: string }

export const decimals = {
  ETH: 18,
  WETH: 18,
  BTC: 8,
  'WBTC.b': 8,
  SOL: 9,
  LINK: 18,
  USDC: 6,
  ARB: 18,
  DOGE: 8,
  XRP: 6,
  UNI: 18,
  LTC: 8,
}

export const tokenAddresses = {
  arbitrum: {
    ETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    BTC: '0x47904963fc8b2340414262125aF798B9655E58Cd',
    ARB: '0x912CE59144191C1204E64559FE8253a0e49E6548',
    SOL: '0x2bcC6D6CdBbDC0a4071e48bb3B969b06B3330c07',
    LINK: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4',
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    'WBTC.b': '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    DOGE: '0xC4da4c24fd591125c3F47b340b6f4f76111883d8',
    XRP: '0xc14e065b0067dE91534e032868f5Ac6ecf2c6868',
    UNI: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0',
    LTC: '0xB46A094Bc4B0adBD801E14b9DB95e05E28962764',
  },
}

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

toFixed(14.84329267, 18) -> '14843292670000'
toFixed(0.99999558, 6) -> '999995580000000000000000'
 */
export const toFixed = (number: number, decimals: number): string => {
  const n = new Decimal(number)
  return n
    .toFixed(SIGNED_PRICE_DECIMALS - decimals)
    .replace('.', '')
    .replace(/^0+/, '')
}
