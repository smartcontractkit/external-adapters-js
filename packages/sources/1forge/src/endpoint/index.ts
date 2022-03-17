import type { TInputParameters as ConvertInputParameters } from './convert'
import type { TInputParameters as QuotesInputParameters } from './quotes'

export type TInputParameters = ConvertInputParameters | QuotesInputParameters

export * as quotes from './quotes'
export * as convert from './convert'
