/**
 * Type definitions for the Canton PoR APIs
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

/** Digital Asset API response structure */
export interface DaResponse {
  instruments: Instrument[]
  nextPageToken: string | null
}

/** Attester API response structure */
export interface AttesterResponse {
  status: string
  total_supply_cbtc: string
  last_updated: string
}
