import type { TInputParameters as CurrentSeasonInputParameters } from './current-season'
import type { TInputParameters as ScoresInputParameters } from './scores'

export type TInputParameters = CurrentSeasonInputParameters | ScoresInputParameters

export * as scores from './scores'
export * as currentSeason from './current-season'
