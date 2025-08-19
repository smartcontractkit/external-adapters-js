import type { TInputParameters as MultiTInputParameters } from './multiReserves'
import type { TInputParameters as SingleTInputParameters } from './reserves'

export type TInputParameters = SingleTInputParameters | MultiTInputParameters

export * as multiReserves from './multiReserves'
export * as reserves from './reserves'
