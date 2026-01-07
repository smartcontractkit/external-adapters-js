import { AttesterResponse } from '../types'
import { parseDecimalString } from '../utils'

const CBTC_DECIMALS = 10

/**
 * Calculates the total supply from the Attester API response.
 * Uses BigInt arithmetic to avoid precision loss with large values.
 */
export function calculateAttesterSupply(response: AttesterResponse): string {
  if (response.status !== 'ready') {
    throw new Error(`Attester not ready: status=${response.status}`)
  }
  if (!response.total_supply_cbtc?.trim()) {
    throw new Error('total_supply_cbtc is missing or empty')
  }
  return parseDecimalString(response.total_supply_cbtc, CBTC_DECIMALS).toString()
}
