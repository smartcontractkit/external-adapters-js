import Decimal from 'decimal.js'

export const DECIMALS = 18

/**
 * Scales a raw integer string from `fromDecimals` to `toDecimals`.
 *
 * returnAs controls output format:
 * - 'truncated': returns integer representation (default)
 * - 'float': returns decimal representation
 */
export function scaleDecimals(
  value: string,
  fromDecimals: number,
  toDecimals: number,
  returnAs: 'truncated' | 'float' = 'truncated',
): string {
  if (fromDecimals === toDecimals) {
    return value
  }
  const diff = fromDecimals - toDecimals
  const raw = new Decimal(value)
  const scaled = raw.div(new Decimal(10).pow(diff))

  if (returnAs === 'float') {
    // Return as decimal string, use toFixed to ensure no scientific notation
    // diff can be -ve if toDecimals > fromDecimals, so max(diff, 0)
    return scaled.toFixed(Math.max(diff, 0), Decimal.ROUND_DOWN)
  }

  return scaled.toFixed(0, Decimal.ROUND_DOWN)
}

/**
 * Extracts a value from `data` using `resultPath`, optionally scaling decimals.
 *
 * Returns `null` when no `resultPath` is provided (no extraction requested).
 * Throws if `resultPath` is provided but the key does not exist in `data`.
 */
export function resolveResult(
  data: Record<string, unknown>,
  resultPath?: string,
  decimals?: number,
  returnAs?: 'truncated' | 'float',
): string | null {
  if (!resultPath) return null

  if (!(resultPath in data)) {
    throw new Error(
      `resultPath '${resultPath}' not found in data. Available keys: ${Object.keys(data).join(
        ', ',
      )}`,
    )
  }

  const raw = String(data[resultPath])
  return decimals !== undefined ? scaleDecimals(raw, DECIMALS, decimals, returnAs) : raw
}
