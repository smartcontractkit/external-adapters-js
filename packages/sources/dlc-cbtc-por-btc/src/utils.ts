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
