import type { TInputParameters as SingleTInputParameters } from './reserves'
import type { TInputParameters as MultiTInputParameters } from './multiReserves'

export type TInputParameters = SingleTInputParameters | MultiTInputParameters

export * as reserves from './reserves'
export * as multiReserves from './multiReserves'
