import { BigNumberish } from 'ethers/utils'

export type TokenAllocation = {
  symbol: string
  balance: BigNumberish
  decimals: number
}

export type TokenAllocations = TokenAllocation[]

export type PriceAllocation = TokenAllocation & {
  price?: number
  quote?: string
}

export type PriceAllocations = PriceAllocation[]

export type Response = {
  [symbol: string]: {
    quote: {
      [symbol: string]: {
        price?: number
        marketCap?: number
      }
    }
  }
}
