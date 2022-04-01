import type { TInputParameters as AllocationsInputParameters } from './allocations'
import type { TInputParameters as TVLInputParameters } from './tvl'

export type TInputParameters = AllocationsInputParameters | TVLInputParameters

export * as allocations from './allocations'
export * as tvl from './tvl'
