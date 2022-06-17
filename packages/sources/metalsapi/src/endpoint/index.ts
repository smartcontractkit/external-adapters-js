import type { TInputParameters as ConvertInputParameters } from './convert'
import type { TInputParameters as LatestInputParameters } from './latest'

export type TInputParameters = ConvertInputParameters | LatestInputParameters

export * as convert from './convert'
export * as latest from './latest'
