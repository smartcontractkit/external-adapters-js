import type { TInputParameters as ConvertInputParameters } from './convert'
import type { TInputParameters as LiveInputParameters } from './live'

export type TInputParameters = ConvertInputParameters | LiveInputParameters

export * as convert from './convert'
export * as live from './live'
