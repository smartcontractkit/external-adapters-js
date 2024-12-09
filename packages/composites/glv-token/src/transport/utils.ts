import Decimal from 'decimal.js'
import fetch, { AxiosResponse } from 'axios'

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

async function callApi(apiURL: string): Promise<AxiosResponse> {
  try {
    const response = await fetch(apiURL)
    if (response.status != 200) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    return response
  } catch (error) {
    throw new Error(`Error fetching the API: ${error}`)
  }
}

export interface Token {
  symbol: string
  address: string
  decimals: number
  synthetic: null | boolean
}

interface ApiTokenData {
  tokens: Token[]
}

export async function getTokenInfo() {
  const token_info: Record<string, Token> = {}
  const decimals_info: Record<string, number> = {}

  const data: ApiTokenData = (await callApi('https://arbitrum-api.gmxinfra.io/tokens')).data
  data.tokens.map((token) => {
    token_info[token.address] = token
    decimals_info[token.symbol] = token.decimals
  })
  return { token_info, decimals_info }
}

export interface Market {
  marketToken: string
  indexToken: string
  longToken: string
  shortToken: string
  isListed: boolean
}

interface ApiMarketData {
  markets: Market[]
}

export async function getMarketsInfo() {
  const market_info: Record<string, Market> = {}

  const data: ApiMarketData = (await callApi('https://arbitrum-api.gmxinfra.io/markets')).data
  data.markets.map((market) => {
    market_info[market.marketToken] = market
  })
  return market_info
}

export const glvMarkets = {
  '0x528A5bac7E746C9A509A1f4F6dF58A03d44279F9': 'ETH/USDC',
  '0xdF03EEd325b82bC1d4Db8b49c30ecc9E05104b96': 'WBTC/USDC',
}

export function mapSymbol(address: string, symbolMap: Record<string, any>) {
  return symbolMap[address]
}
