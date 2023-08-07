import type { TInputParameters as BalanceInputParameters } from './balance'
import type { TInputParameters as StatsInputParameters } from './stats'

export type TInputParameters = BalanceInputParameters | StatsInputParameters

export * as balance from './balance'
export * as stats from './stats'
