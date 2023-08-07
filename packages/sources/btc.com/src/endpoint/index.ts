import type { TInputParameters as BalanceInputParameters } from './balance'
import type { TInputParameters as BlockInputParameters } from './block'

export type TInputParameters = BalanceInputParameters | BlockInputParameters

export * as balance from './balance'
export * as block from './block'
