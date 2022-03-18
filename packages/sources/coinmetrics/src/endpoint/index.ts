import type { TInputParameters as PriceInputParameters } from './price'
import type { TInputParameters as BurnedInputParameters } from './burned'
import type { TInputParameters as TotalInputParameters } from './total-burned'

export type TInputParameters = PriceInputParameters | BurnedInputParameters | TotalInputParameters

export * as price from './price'
export * as burned from './burned'
export * as totalBurned from './total-burned'
