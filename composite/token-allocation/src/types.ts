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
