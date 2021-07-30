import { Config as DefaultConfig } from '@chainlink/types'
import { BigNumberish } from 'ethers'

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

export type GetPrices = (
  baseSymbols: string[],
  quote: string,
  withMarketCap?: boolean,
) => Promise<ResponsePayload>

export type SourceRequestOptions = { [source: string]: DefaultConfig }

export type Config = {
  sources: SourceRequestOptions
  defaultMethod: string
  defaultQuote: string
  defaultSource?: string
}
