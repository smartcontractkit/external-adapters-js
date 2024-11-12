import type { TInputParameters as MaticXInputParameters } from './maticx'
import type { TInputParameters as sFTMxInputParameters } from './sftmx'
import type { TInputParameters as BNBxInputParameters } from './bnbx'

export type TInputParameters = MaticXInputParameters | sFTMxInputParameters | BNBxInputParameters

export * as maticx from './maticx'
export * as sftmx from './sftmx'
export * as bnbx from './bnbx'
