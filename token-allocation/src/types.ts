import { BigNumberish } from 'ethers/utils'

export type TokenAllocation = {
  symbol: string
  balance: BigNumberish
  decimals: number
  price?: number
  currency?: string
}

export type TokenAllocations = TokenAllocation[]

type QuoteSymbol = {
  price?: number
  marketCap?: number
}

type Quote = {
  [symbol: string]: QuoteSymbol
}

type ResponseAsset = {
  quote: Quote
  balance: string
}

export type Response = {
  [symbol: string]: ResponseAsset
}
