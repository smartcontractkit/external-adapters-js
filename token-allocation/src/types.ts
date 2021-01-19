import { BigNumberish } from 'ethers/utils'

export type TokenAllocation = {
  symbol: string
  balance: BigNumberish
  decimals: number
}

export type TokenAllocations = TokenAllocation[]

export type PriceAllocation = TokenAllocation & {
  price?: number
  marketcap?: number
  quote?: string
}

export type PriceAllocations = PriceAllocation[]

export type Response = {
  result: number
  allocations: {
    [symbol: string]: {
      quote: {
        [symbol: string]: {
          price?: number
          marketcap?: number
        }
      }
    }
  }
}

export type TotalCalculation = (allocations: PriceAllocations) => number
