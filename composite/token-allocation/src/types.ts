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

export type PriceAdapter = {
  getPrices: (
    baseSymbols: string[],
    quote: string,
    withMarketCap?: boolean,
  ) => Promise<ResponsePayload>
}

export type Config = {
  priceAdapter: PriceAdapter
  defaultMethod: string
  defaultQuote: string
}

export type DataProviderConfig = {
  batchingSupport: boolean
  batchEndpoint?: string
}
