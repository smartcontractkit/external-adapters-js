import type { TInputParameters as ReadInputParameters } from './read'
import type { TInputParameters as WriteInputParameters } from './write'

export type TInputParameters = ReadInputParameters | WriteInputParameters

export * as read from './read'
export * as write from './write'
