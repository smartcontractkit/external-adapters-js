import type { TInputParameters as GetPayoutInputParameters } from './getPayout'
import type { TInputParameters as SendPayoutInputParameters } from './sendPayout'

export type TInputParameters = GetPayoutInputParameters | SendPayoutInputParameters

export * as sendPayout from './sendPayout'
export * as getPayout from './getPayout'
