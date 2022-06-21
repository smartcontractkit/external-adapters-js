import { TInputParameters as CryptoInputParameters } from './crypto'
import { TInputParameters as CryptoSingleInputParameters } from './crypto-single'
import { TInputParameters as DominanceInputParameters } from './dominance'
import { TInputParameters as GlobalMcapInputParameters } from './globalMarketcap'
import { TInputParameters as CoinsInputParameters } from './coins'
import { TInputParameters as VwapInputParameters } from './vwap'

export type TInputParameters =
  | CryptoInputParameters
  | CryptoSingleInputParameters
  | DominanceInputParameters
  | GlobalMcapInputParameters
  | CoinsInputParameters
  | VwapInputParameters

export * as crypto from './crypto'
export * as cryptoSingle from './crypto-single'
export * as dominance from './dominance'
export * as globalMarketcap from './globalMarketcap'
export * as coins from './coins'
export * as vwap from './vwap'
