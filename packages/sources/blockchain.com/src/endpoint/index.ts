import type { TInputParameters as BalanceInputParameters } from './balance'
import type { TInputParameters as DifficultyInputParameters } from './difficulty'
import type { TInputParameters as HeightInputParameters } from './height'

export type TInputParameters =
  | BalanceInputParameters
  | DifficultyInputParameters
  | HeightInputParameters

export * as balance from './balance'
export * as difficulty from './difficulty'
export * as height from './height'
