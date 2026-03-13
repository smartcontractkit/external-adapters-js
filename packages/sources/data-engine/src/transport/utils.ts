import Decimal from 'decimal.js'

export const DECIMALS = 18

/**
 * Scales a raw integer string from `fromDecimals` to `toDecimals`.
 * Uses truncation (floor toward zero) when scaling down.
 */
export function scaleDecimals(value: string, fromDecimals: number, toDecimals: number): string {
  if (fromDecimals === toDecimals) {
    return value
  }
  const diff = fromDecimals - toDecimals
  const raw = new Decimal(value)
  const scaled = raw.div(new Decimal(10).pow(diff))
  return scaled.toFixed(0, Decimal.ROUND_DOWN)
}
