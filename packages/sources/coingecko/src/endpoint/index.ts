import type { TInputParameters as CoinsInputParameters } from './coins'
import type { TInputParameters as CryptoInputParameters } from './crypto'
import type { TInputParameters as GlobalInputParameters } from './global'

export type TInputParameters = CoinsInputParameters | CryptoInputParameters | GlobalInputParameters

export * as crypto from './crypto'
export * as global from './global'
export * as coins from './coins'
