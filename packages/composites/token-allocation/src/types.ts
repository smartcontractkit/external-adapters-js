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
  additionalInput: Record<string, unknown>,
  withMarketCap: boolean,
) => Promise<ResponsePayload>

export type SourceRequestOptions = { [source: string]: DefaultConfig }

export interface Config extends DefaultConfig {
  sources: SourceRequestOptions
  defaultMethod: string
  defaultQuote: string
  defaultSource?: string
}
