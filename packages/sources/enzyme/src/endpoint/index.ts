import type { TInputParameters as GavInputParameters } from './calcGav'
import type { TInputParameters as NavInputParameters } from './calcNav'
import type { TInputParameters as NetValInputParameters } from './calcNetValueForSharesHolder'
import type { TInputParameters as NetShareInputParameters } from './calcNetShareValueInAsset'

export type TInputParameters =
  | GavInputParameters
  | NavInputParameters
  | NetValInputParameters
  | NetShareInputParameters

export * as calcGav from './calcGav'
export * as calcNav from './calcNav'
export * as calcNetValueForSharesHolder from './calcNetValueForSharesHolder'
export * as calcNetShareValueInAsset from './calcNetShareValueInAsset'
