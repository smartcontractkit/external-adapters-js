import type { TInputParameters as ValidatorInputParameters } from './validator'
import type { TInputParameters as BalanceInputParameters } from './balance'

export type TInputParameters = ValidatorInputParameters | BalanceInputParameters

export * as validator from './validator'
export * as balance from './balance'
