import type { TInputParameters as GavInputParameters } from './calcGav'
import type { TInputParameters as NavInputParameters } from './calcNav'
import type { TInputParameters as NetValInputParameters } from './calcNetValueForSharesHolder'

export type TInputParameters = GavInputParameters | NavInputParameters | NetValInputParameters

export * as calcGav from './calcGav'
export * as calcNav from './calcNav'
export * as calcNetValueForSharesHolder from './calcNetValueForSharesHolder'
