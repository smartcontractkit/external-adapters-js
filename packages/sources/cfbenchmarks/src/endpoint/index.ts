import type { TInputParameters as ValuesInputParameters } from './values'
import type { TInputParameters as BircInputParameters } from './birc'

export type TInputParameters = ValuesInputParameters | BircInputParameters

export * as values from './values'
export * as birc from './birc'
