import type { TInputParameters as StockInputParameters } from './stock'
import type { TInputParameters as EodInputParameters } from './eod'
import type { TInputParameters as ForexInputParameters } from './forex'
import type { TInputParameters as CryptoInputParameters } from './crypto'
import type { TInputParameters as CommoditiesInputParameters } from './commodities'
import type { TInputParameters as UkEtfInputParameters } from './uk-etf'

export type TInputParameters =
  | StockInputParameters
  | EodInputParameters
  | ForexInputParameters
  | CryptoInputParameters
  | CommoditiesInputParameters
  | UkEtfInputParameters

export * as stock from './stock'
export * as eod from './eod'
export * as forex from './forex'
export * as crypto from './crypto'
export * as commodities from './commodities'
export * as ukEtf from './uk-etf'
