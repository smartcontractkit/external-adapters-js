import { Instrument } from '../types'
import { parseDecimalString } from '../utils'

/**
 * Extracts and calculates the CBTC total supply from the Digital Asset API response.
 * Uses BigInt arithmetic to avoid precision loss with large values.
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
