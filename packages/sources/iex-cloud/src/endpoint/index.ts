import type { TInputParameters as StockInputParameters } from './stock'
import type { TInputParameters as CryptoInputParameters } from './crypto'
import type { TInputParameters as EodInputParameters } from './eod'

export type TInputParameters = StockInputParameters | CryptoInputParameters | EodInputParameters

export * as stock from './stock'
export * as crypto from './crypto'
export * as eod from './eod'
