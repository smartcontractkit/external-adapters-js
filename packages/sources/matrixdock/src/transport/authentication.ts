import CryptoJS from 'crypto-js'

export interface GetRequestHeadersParams {
  method: string
  path: string
  queryString: string
  apiKey: string
  secret: string
  timestamp: number
}

/**
 * Generate the HMAC-SHA256 signature for Matrixdock API requests using AuthenticationV2.
 *
 * The prehash string is constructed as:
 * {timestamp}{method}{api_path}&{query_string}
 *
 * Where:
 * - timestamp: Current UTC timestamp in milliseconds
 * - method: HTTP method in uppercase (e.g., "GET")
 * - api_path: Request path (e.g., "/rwa/api/v1/quote/price")
 * - query_string: Query parameters as a string (e.g., "symbol=XAUM")
 *
 * Example prehash:
 * 1731931956000GET/mapi/v1/wallet/withdrawals&currency=BTC&limit=50
 */
export const getRequestHeaders = ({
  method,
  path,
  queryString,
  apiKey,
  secret,
  timestamp,
}: GetRequestHeadersParams): Record<string, string> => {
  // Construct prehash: timestamp + method + api_path + '&' + query_string
  const prehash = `${timestamp}${method.toUpperCase()}${path}&${queryString}`

  // signature = hex(hmac_sha256(prehash, secret_key))
  const signature = CryptoJS.HmacSHA256(prehash, secret).toString(CryptoJS.enc.Hex)

  return {
    'X-MatrixPort-Access-Key': apiKey,
    'X-Signature': signature,
    'X-Timestamp': timestamp.toString(),
    'X-Auth-Version': 'v2',
  }
}
