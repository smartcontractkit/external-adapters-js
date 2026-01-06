/**
 * Type definitions for the Canton PoR APIs
 */

/**
 * String response type to handle values beyond Number.MAX_SAFE_INTEGER.
 * CBTC uses 10 decimals, so 21M supply = 2.1×10^17 base units (exceeds 9×10^15 limit).
 */
export type StringResultResponse = {
  Data: { result: string }
  Result: string
}

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
