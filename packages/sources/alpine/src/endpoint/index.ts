import type { TInputParameters as LastBlockInputParameters } from './lastblock'
import type { TInputParameters as TvlInputParameters } from './tvl'

export type TInputParameters = LastBlockInputParameters | TvlInputParameters

export * as lastblock from './lastblock'
export * as tvl from './tvl'
