import { BigNumberish } from 'ethers'
import { RequestConfig } from '@chainlink/types'

export type TokenAllocation = {
  symbol: string
  decimals: number
  balance: BigNumberish
}

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

export type TokenAllocations = TokenAllocation[]

export type PriceAdapter = {
  getPrices: (
    baseSymbols: string[],
    quote: string,
    withMarketCap?: boolean,
  ) => Promise<ResponsePayload>
}

export type SourceRequestOptions = { [source: string]: RequestConfig }

export type Config = {
  sources: SourceRequestOptions
  defaultMethod: string
  defaultQuote: string
}
