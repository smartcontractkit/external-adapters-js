import type { TInputParameters as EodInputParameters } from './eod'
import type { TInputParameters as IexInputParameters } from './iex'
import type { TInputParameters as TopInputParameters } from './crypto/top'
import type { TInputParameters as PricesInputParameters } from './crypto/prices'
import type { TInputParameters as ForexInputParameters } from './forex'
import type { TInputParameters as VwapInputParameters } from './crypto/vwap'

export type TInputParameters =
  | EodInputParameters
  | IexInputParameters
  | TopInputParameters
  | PricesInputParameters
  | ForexInputParameters
  | VwapInputParameters

export * as eod from './eod'
export * as iex from './iex'
export * as top from './crypto/top'
export * as prices from './crypto/prices'
export * as forex from './forex'
export * as cryptoVwap from './crypto/vwap'
