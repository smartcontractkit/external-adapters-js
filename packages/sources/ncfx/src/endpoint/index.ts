import type { TInputParameters as CryptoInputParameters } from './crypto'
import type { TInputParameters as ForexInputParameters } from './forex'

export type TInputParameters = CryptoInputParameters | ForexInputParameters

export * as crypto from './crypto'
export * as forex from './forex'
