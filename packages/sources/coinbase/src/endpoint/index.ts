import type { TInputParameters as CryptoInputParameters } from './crypto'
import type { TInputParameters as NFTPriceFloorInputParameters } from './nftFloorPrice'

export type TInputParameters = CryptoInputParameters | NFTPriceFloorInputParameters

export * as crypto from './crypto'
export * as nftFloorPrice from './nftFloorPrice'
