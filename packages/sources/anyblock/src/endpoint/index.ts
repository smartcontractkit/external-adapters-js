import type { TInputParameters as GasPriceInputParameters } from './gasprice'
import type { TInputParameters as VwapInputParameters } from './vwap'

export type TInputParameters = GasPriceInputParameters | VwapInputParameters

export * as gasprice from './gasprice'
export * as vwap from './vwap'
