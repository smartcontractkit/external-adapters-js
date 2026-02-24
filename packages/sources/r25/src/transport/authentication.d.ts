export interface GetRequestHeadersParams {
  method: string
  path: string
  params: Record<string, string>
  apiKey: string
  secret: string
  timestamp: number
}
/**
 * Generate the HMAC-SHA256 signature for R25 API requests.
 *
 * The signature string is constructed as:
 * {method}\n{path}\n{sorted_params}\n{timestamp}\n{api_key}
 *
 * Where:
 * - method: HTTP method in lowercase (e.g., "get")
 * - path: Request path (e.g., "/api/public/current/nav")
 * - sorted_params: Query parameters sorted by key, formatted as key=value, joined with &
 * - timestamp: Current UTC timestamp in milliseconds
 * - api_key: API key
 */
export declare const getRequestHeaders: (
  getRequestHeadersParams: GetRequestHeadersParams,
) => Record<string, string>
//# sourceMappingURL=authentication.d.ts.map
