import type { TInputParameters as CurrentSeasonInputParameters } from './current-season'
import type { TInputParameters as ScheduleInputParameters } from './schedule'
import type { TInputParameters as ScoresInputParameters } from './scores'
import type { TInputParameters as TeamsInputParameters } from './teams'

export type TInputParameters =
  | CurrentSeasonInputParameters
  | ScheduleInputParameters
  | ScoresInputParameters
  | TeamsInputParameters

export * as currentSeason from './current-season'
export * as schedule from './schedule'
export * as scores from './scores'
export * as teams from './teams'
