import type { TInputParameters as PriceInputParameters } from './price'
import type { TInputParameters as RatioInputParameters } from './ratio'
import type { TInputParameters as SushiInputParameters } from './sushi'

export type TInputParameters = PriceInputParameters | RatioInputParameters | SushiInputParameters

export * as price from './price'
export * as ratio from './ratio'
export * as sushi from './sushi'
