/**
 * Shared utilities for Canton PoR adapters
 */

/**
 * Builds a URL by appending a path to a base endpoint.
 * Properly handles base URLs that already contain query parameters.
 */
export function buildUrl(baseEndpoint: string, path: string): string {
  const url = new URL(baseEndpoint)
  url.pathname = url.pathname.replace(/\/$/, '') + path
  return url.toString()
}

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

/**
 * Parse comma-separated URLs into an array, trimming whitespace.
 */
export function parseUrls(urlsString: string): string[] {
  return urlsString
    .split(',')
    .map((url) => url.trim())
    .filter((url) => url.length > 0)
}

/**
 * Calculate median of BigInt values.
 * Returns the middle value for odd-length arrays, or the lower of two middle values for even-length.
 */
export function medianBigInt(values: bigint[]): bigint {
  if (values.length === 0) {
    throw new Error('Cannot calculate median of empty array')
  }

  const sorted = [...values].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  return sorted[Math.ceil(sorted.length / 2) - 1]
}
