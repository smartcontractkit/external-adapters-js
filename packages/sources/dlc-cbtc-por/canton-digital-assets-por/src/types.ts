/**
 * Type definitions for the Canton Digital Assets API
 */

/** Instrument data from the Digital Asset API */
export interface Instrument {
  id: string
  name: string
  symbol: string
  totalSupply: string
  totalSupplyAsOf: string | null
  decimals: number
  supportedApis: Record<string, number>
}

/** API response structure */
export interface ApiResponse {
  instruments: Instrument[]
  nextPageToken: string | null
}
