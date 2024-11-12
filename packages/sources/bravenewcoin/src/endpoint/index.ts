import type { TInputParameters as CryptoInputParameters } from './crypto'
import type { TInputParameters as VwapInputParameters } from './vwap'

export type TInputParameters = CryptoInputParameters | VwapInputParameters

export * as crypto from './crypto'
export * as vwap from './vwap'
