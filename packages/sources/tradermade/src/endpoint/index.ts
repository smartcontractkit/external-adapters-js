import type { TInputParameters as LiveInputParameters } from './live'
import type { TInputParameters as ForexInputParameters } from './forex'

export type TInputParameters = LiveInputParameters | ForexInputParameters

export * as live from './live'
export * as forex from './forex'
