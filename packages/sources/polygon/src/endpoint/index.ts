import type { TInputParameters as ConversionInputParameters } from './conversion'
import type { TInputParameters as TickersInputParameters } from './tickers'

export type TInputParameters = ConversionInputParameters | TickersInputParameters

export * as tickers from './tickers'
export * as conversion from './conversion'
