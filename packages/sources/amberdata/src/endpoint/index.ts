import type { TInputParameters as BalanceInputParameters } from './balance'
import type { TInputParameters as CryptoInputParameters } from './crypto'
import type { TInputParameters as TokenInputParameters } from './token'
import type { TInputParameters as GasPriceInputParameters } from './gasprice'
import type { TInputParameters as VolumeInputParameters } from './volume'

export type TInputParameters =
  | BalanceInputParameters
  | CryptoInputParameters
  | TokenInputParameters
  | GasPriceInputParameters
  | VolumeInputParameters

export * as balance from './balance'
export * as crypto from './crypto'
export * as token from './token'
export * as gasprice from './gasprice'
export * as volume from './volume'
