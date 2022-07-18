import type { TInputParameters as MaticXInputParameters } from './maticx'
import type { TInputParameters as sFTMxInputParameters } from './sftmx'

export type TInputParameters = MaticXInputParameters | sFTMxInputParameters

export * as maticx from './maticx'
export * as sftmx from './sftmx'
