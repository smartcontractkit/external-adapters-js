import { Config as BaseConfig, DefaultConfig, BigNumberish } from '@chainlink/ea-bootstrap'

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

export interface Config extends BaseConfig {
  sources: SourceRequestOptions
  defaultMethod: string
  defaultQuote: string
  defaultSource?: string
}

export { TInputParameters, inputParameters } from './endpoint'
