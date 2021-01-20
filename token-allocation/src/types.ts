import { BigNumberish } from 'ethers/utils'

export type TokenAllocation = {
  symbol: string
  decimals: number
  balance: BigNumberish
}

export type TokenAllocations = TokenAllocation[]

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
