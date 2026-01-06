import { AttesterResponse, Instrument } from '../types'
import { parseDecimalString } from '../utils'

const CBTC_DECIMALS = 10

/**
 * Extracts and calculates the CBTC total supply from the Digital Asset API response.
 * Uses BigInt arithmetic to avoid precision loss with large values.
 * Throws on invalid input - never returns default values.
 */
export function calculateDaSupply(instruments: Instrument[]): string {
  if (!instruments || instruments.length === 0) {
    throw new Error('No instruments found in API response')
  }

  const cbtcInstrument = instruments.find((i) => i.symbol === 'CBTC')
  if (!cbtcInstrument) {
    throw new Error('CBTC instrument not found in API response')
  }

  if (!cbtcInstrument.totalSupply?.trim()) {
    throw new Error('CBTC totalSupply is missing or empty')
  }

  if (cbtcInstrument.decimals == null || cbtcInstrument.decimals < 0) {
    throw new Error('CBTC decimals is missing or invalid')
  }

  return parseDecimalString(cbtcInstrument.totalSupply, cbtcInstrument.decimals).toString()
}

/**
 * Calculates the total supply from the Attester API response.
 * Uses BigInt arithmetic to avoid precision loss with large values.
 * Throws on invalid input - never returns default values.
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
