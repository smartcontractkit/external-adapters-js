/**
 * Shared utilities for BTC PoR adapter
 */

/**
 * Builds a URL by appending a path to a base endpoint.
 * Properly handles base URLs that already contain query parameters.
 *
 * API keys are typically specified as query parameters in the base URL:
 *   - Path-based auth: "https://api.example.com/SECRET_KEY"
 *   - Query param auth: "https://api.example.com?auth=TOKEN"
 *
 * Both formats are preserved when paths are appended.
 *
 * @example
 * buildUrl("https://api.example.com", "/blocks/tip/height")
 *   => "https://api.example.com/blocks/tip/height"
 *
 * buildUrl("https://api.example.com/electrs?auth=TOKEN", "/blocks/tip/height")
 *   => "https://api.example.com/electrs/blocks/tip/height?auth=TOKEN"
 */
export function buildUrl(baseEndpoint: string, path: string): string {
  const url = new URL(baseEndpoint)
  // Append path to existing pathname (ensuring no double slashes)
  url.pathname = url.pathname.replace(/\/$/, '') + path
  return url.toString()
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
  const mid = Math.floor(sorted.length / 2)

  // For even length, return lower middle value
  return sorted.length % 2 === 0 ? sorted[mid - 1] : sorted[mid]
}
