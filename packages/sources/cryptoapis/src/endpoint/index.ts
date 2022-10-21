import type { TInputParameters as BalanceInputParameters } from './balance'
import type { TInputParameters as CryptoInputParameters } from './crypto'
import type { TInputParameters as BcInfoInputParameters } from './bc_info'

export type TInputParameters =
  | BalanceInputParameters
  | CryptoInputParameters
  | BcInfoInputParameters

export * as balance from './balance'
export * as crypto from './crypto'
export * as bc_info from './bc_info'
