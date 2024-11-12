import type { TInputParameters as BalanceInputParameters } from './balance'
import type { TInputParameters as PriceInputParameters } from './price'
import type { TInputParameters as BcInfoInputParameters } from './bc_info'

export type TInputParameters = BalanceInputParameters | PriceInputParameters | BcInfoInputParameters

export * as balance from './balance'
export * as price from './price'
export * as bc_info from './bc_info'
