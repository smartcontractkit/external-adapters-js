import type { TInputParameters as CryptoInputParameters } from './crypto'
import type { TInputParameters as TotalMarketCapInputParameters } from './totalMarketCap'

export type TInputParameters = CryptoInputParameters | TotalMarketCapInputParameters

export * as crypto from './crypto'
export * as totalMarketCap from './totalMarketCap'
