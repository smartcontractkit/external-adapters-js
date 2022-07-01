import type { TInputParameters as GlobalMcapInputParameters } from './globalmarketcap'
import type { TInputParameters as CryptoInputParameters } from './crypto'
import type { TInputParameters as FilteredInputParameters } from './filtered'

export type TInputParameters =
  | GlobalMcapInputParameters
  | CryptoInputParameters
  | FilteredInputParameters

export * as globalmarketcap from './globalmarketcap'
export * as crypto from './crypto'
export * as filtered from './filtered'
