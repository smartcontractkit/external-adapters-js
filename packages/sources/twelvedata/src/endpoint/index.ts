import type { TInputParameters as ClosingInputParameters } from './closing'
import type { TInputParameters as PriceInputParameters } from './price'

export type TInputParameters = ClosingInputParameters | PriceInputParameters

export * as closing from './closing'
export * as price from './price'
