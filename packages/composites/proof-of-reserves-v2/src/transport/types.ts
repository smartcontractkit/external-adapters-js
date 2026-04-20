import { FixedPoint } from '../utils/fixed-point'

export type Fetcher = (
  provider: string,
  params: Record<string, unknown>,
) => Promise<Record<string, unknown>>

export type Stringifier = (data: Record<string, unknown>) => string

export type ProcessedComponent = {
  name: string
  currency: string
  totalBalance: FixedPoint
  originalCurrency: string
  totalBalanceInOriginalCurrency: FixedPoint
  addressCount?: number
}
