import type { TInputParameters as CollectionsInputParameters } from './collections'
import type { TInputParameters as PunksInputParameters } from './punks'

export type TInputParameters = PunksInputParameters | CollectionsInputParameters

export * as punks from './punks'
export * as collections from './collections'
