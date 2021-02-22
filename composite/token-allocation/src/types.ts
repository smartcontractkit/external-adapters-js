import { BigNumberish } from 'ethers'

export type TokenAllocation = {
  symbol: string
  decimals: number
  balance: BigNumberish
}

export type TokenAllocations = TokenAllocation[]

export type ResponsePayload = {
  [symbol: string]: {
    quote: {
      [symbol: string]: {
        price?: number
        marketCap?: number
      }
    }
  }
}

export type PriceAdapter = {
  getPrices: (baseSymbols: string[], quote: string) => Promise<ResponsePayload>
  getMarketCaps: (baseSymbols: string[], quote: string) => Promise<ResponsePayload>
}

export type Config = {
  priceAdapter: PriceAdapter
  defaultMethod: string
  defaultQuote: string
}
