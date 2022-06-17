import type { TInputParameters as DominanceInputParameters } from './dominance'
import type { TInputParameters as CryptoInputParameters } from './crypto'
import type { TInputParameters as GlobalInputParameters } from './globalMarketCap'
import type { TInputParameters as HistoricalInputParameters } from './historical'

export type TInputParameters =
  | DominanceInputParameters
  | CryptoInputParameters
  | GlobalInputParameters
  | HistoricalInputParameters

export * as dominance from './dominance'
export * as crypto from './crypto'
export * as globalMarketCap from './globalMarketCap'
export * as historical from './historical'
