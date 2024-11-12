import type { TInputParameters as TotalScoreInputParameters } from './totalScore'
import type { TInputParameters as EventInputParameters } from './events'
import type { TInputParameters as EventsInputParameters } from './event'

export type TInputParameters =
  | TotalScoreInputParameters
  | EventInputParameters
  | EventsInputParameters

export * as totalScore from './totalScore'
export * as events from './events'
export * as event from './event'
