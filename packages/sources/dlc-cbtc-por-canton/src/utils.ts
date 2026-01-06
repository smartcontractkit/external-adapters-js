/**
 * Shared utilities for Canton PoR adapters
 */

/**
 * Parses a decimal string and scales it to an integer with the given precision.
 * Throws on invalid input - never returns default values.
 *
 * @example
 * parseDecimalString("11.7127388", 10) → 117127388000n
 * parseDecimalString("100", 8) → 10000000000n
 */
export function parseDecimalString(value: string, decimals: number): bigint {
  const [whole, frac = ''] = value.split('.')
  return BigInt(whole + frac.padEnd(decimals, '0').slice(0, decimals))
}
