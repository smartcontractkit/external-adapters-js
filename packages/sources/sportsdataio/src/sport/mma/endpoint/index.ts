import type { TInputParameters as ScheduleInputParameters } from './schedule'
import type { TInputParameters as EventInputParameters } from './event'
import type { TInputParameters as FightInputParameters } from './fight'
import type { TInputParameters as LeaguesInputParameters } from './leagues'

export type TInputParameters =
  | ScheduleInputParameters
  | EventInputParameters
  | FightInputParameters
  | LeaguesInputParameters

export * as schedule from './schedule'
export * as event from './event'
export * as fight from './fight'
export * as leagues from './leagues'
