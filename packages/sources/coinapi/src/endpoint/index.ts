import type { TInputParameters as CryptoInputParameters } from './crypto'
import type { TInputParameters as AssetsInputParameters } from './assets'

export type TInputParameters = CryptoInputParameters | AssetsInputParameters

export * as crypto from './crypto'
export * as assets from './assets'
