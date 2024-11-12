import type { TInputParameters as ScheduleInputParameters } from './schedule'
import type { TInputParameters as ScoreInputParameters } from './score'

export type TInputParameters = ScheduleInputParameters | ScoreInputParameters

export * as schedule from './schedule'
export * as score from './score'
