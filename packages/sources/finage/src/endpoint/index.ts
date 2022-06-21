import type { TInputParameters as StockInputParameters } from './stock'
import type { TInputParameters as EodInputParameters } from './eod'
import type { TInputParameters as ForexInputParameters } from './forex'
import type { TInputParameters as CryptoInputParameters } from './crypto'

export type TInputParameters =
  | StockInputParameters
  | EodInputParameters
  | ForexInputParameters
  | CryptoInputParameters

export * as stock from './stock'
export * as eod from './eod'
export * as forex from './forex'
export * as crypto from './crypto'
