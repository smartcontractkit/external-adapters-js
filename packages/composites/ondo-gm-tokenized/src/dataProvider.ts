import { Requester, Logger } from '@chainlink/ea-bootstrap'
import { Config } from './config'
import { AxiosRequestConfig } from '@chainlink/ea-bootstrap'
import crypto from 'crypto'

/**
 * Single report data structure
 */
interface SingleReport {
  feedID: string
  validFromTimestamp: number
  observationsTimestamp: number
  fullReport: string
}

/**
 * SingleReportResponse is the response structure for a single report
 */
interface SingleReportResponse {
  report: SingleReport
}

// Types for Ondo API response
export interface OndoMarketData {
  primaryMarket: {
    sharesMultiplier: string
    newMultiplier?: string
    activationDateTime?: number
  }
}

export interface DataStreamsResponse {
  price: string
  timestamp: number
}

/**
 * Fetch multiplier data from Ondo API
 */
export const getOndoMultiplierData = async (
  symbol: string,
  config: Config,
): Promise<OndoMarketData> => {
  const url = `${config.baseUrl}/v1/assets/${symbol}/market`

  const requestConfig: AxiosRequestConfig = {
    ...config.api,
    url,
    method: 'GET',
    headers: {
      ...config.api?.headers,
      Authorization: `Bearer ${config.ondoApiKey}`,
      'Content-Type': 'application/json',
    },
  }

  Logger.debug(`Fetching Ondo multiplier data for ${symbol} from ${url}`)

  const response = await Requester.request<OndoMarketData>(requestConfig)
  return response.data
}

/**
 * Calculate the active multiplier based on current time and activation logic
 */
export const calculateActiveMultiplier = (marketData: OndoMarketData): number => {
  const { sharesMultiplier, newMultiplier, activationDateTime } = marketData.primaryMarket

  // Current multiplier (always available)
  const currentMultiplier = parseFloat(sharesMultiplier)

  // If no new multiplier or activation time, use current
  if (!newMultiplier || !activationDateTime) {
    Logger.debug(`Using current multiplier: ${currentMultiplier}`)
    return currentMultiplier
  }

  // Check if activation time has passed
  const nowUTC = Math.floor(Date.now() / 1000) // Current time in epoch seconds
  const shouldActivate = nowUTC >= activationDateTime

  const activeMultiplier = shouldActivate ? parseFloat(newMultiplier) : currentMultiplier

  Logger.debug(
    `Activation check: now=${nowUTC}, activation=${activationDateTime}, shouldActivate=${shouldActivate}`,
  )
  Logger.debug(`Using ${shouldActivate ? 'new' : 'current'} multiplier: ${activeMultiplier}`)

  return activeMultiplier
}

/**
 * Fetch underlying price from Chainlink Data Streams
 * Note: This is a placeholder implementation. In practice, you would integrate with
 * the actual Chainlink Data Streams API using the feedId.
 */
export const getDataStreamsPrice = async (feedId: string, config: Config): Promise<number> => {
  // API connection details
  const method = 'GET'
  const host = 'api.testnet-dataengine.chain.link'
  const path = '/api/v1/reports/latest'
  const queryString = `?feedID=${feedId}`
  const fullUrl = `https://${host}${path}${queryString}`
  const streamsApiKey = config.streamsApiKey
  const streamsApiSecret = config.streamsApiSecret

  if (!streamsApiKey || !streamsApiSecret) {
    throw new Error(
      'STREAMS_API_KEY and STREAMS_API_SECRET must be set in the environment variables',
    )
  }

  const requestConfig: AxiosRequestConfig = {
    url: fullUrl,
    method,
    headers: generateAuthHeaders(method, path + queryString, streamsApiKey, streamsApiSecret),
    // Add any other config.api options if needed
    ...config.api,
  }

  Logger.debug(`Requesting Data Streams price for feedId: ${feedId} from ${fullUrl}`)

  try {
    const response = await Requester.request<SingleReportResponse>(requestConfig)
    // Parse the response
    const result = response.data
    console.log(result)
    // TODO Parse price value from result
    return 1
  } catch (error) {
    Logger.error(`Error fetching Data Streams price for feedId ${feedId}: ${error}`)
    throw error
  }
}

/**
 * Calculate the final tokenized price with 8 decimal precision
 */
export const calculateTokenizedPrice = (
  underlyingPrice: number,
  activeMultiplier: number,
): string => {
  const tokenizedPrice = underlyingPrice * activeMultiplier

  // Round to 8 decimal places and return as string
  const result = tokenizedPrice.toFixed(8)

  Logger.debug(`Calculation: ${underlyingPrice} × ${activeMultiplier} = ${result}`)

  return result
}

/**
 * Generates authentication headers for API requests
 * @param method - HTTP method
 * @param path - Request path with query parameters
 * @param apiKey - API key
 * @param apiSecret - API secret
 * @returns Headers object for the request
 */
function generateAuthHeaders(
  method: string,
  path: string,
  apiKey: string,
  apiSecret: string,
): Record<string, string> {
  const { signature, timestamp } = generateHMAC(method, path, '', apiKey, apiSecret)

  return {
    Authorization: apiKey,
    'X-Authorization-Timestamp': timestamp.toString(),
    'X-Authorization-Signature-SHA256': signature,
  }
}

/**
 * Generates HMAC signature for API authentication
 * @param method - HTTP method (GET, POST, etc.)
 * @param path - Request path including query parameters
 * @param body - Request body (empty string for GET)
 * @param apiKey - API key for authentication
 * @param apiSecret - API secret for signature generation
 * @returns Object containing signature and timestamp
 */
function generateHMAC(
  method: string,
  path: string,
  body: string | Buffer,
  apiKey: string,
  apiSecret: string,
): { signature: string; timestamp: number } {
  // Generate timestamp (milliseconds since Unix epoch)
  const timestamp: number = Date.now()

  // Create body hash (empty for GET request)
  const bodyHash: string = crypto
    .createHash('sha256')
    .update(body || '')
    .digest('hex')

  // Create string to sign
  const stringToSign: string = `${method} ${path} ${bodyHash} ${apiKey} ${timestamp}`

  // Generate HMAC-SHA256 signature
  const signature: string = crypto
    .createHmac('sha256', apiSecret)
    .update(stringToSign)
    .digest('hex')

  return { signature, timestamp }
}
