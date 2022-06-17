import type { TInputParameters as CurrConditionsInputParameters } from './current-conditions'
import type { TInputParameters as LocationCurrContitionsInputParameters } from './location-current-conditions'
import type { TInputParameters as LocationInputParameters } from './location'

export type TInputParameters =
  | CurrConditionsInputParameters
  | LocationCurrContitionsInputParameters
  | LocationInputParameters

export * as currentConditions from './current-conditions'
export * as locationCurrentConditions from './location-current-conditions'
export * as location from './location'
