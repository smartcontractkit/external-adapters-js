/**
 * Utility functions for coinpaprika-state adapter
 */

/**
 * Coerces a value to a number, handling string conversion and null/undefined cases
 * @param value - The value to convert to a number
 * @returns A finite number, or NaN if conversion fails
 */
export function toNumber(value: string | number | undefined | null): number {
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isFinite(n) ? n : NaN
  }
  return NaN
}
