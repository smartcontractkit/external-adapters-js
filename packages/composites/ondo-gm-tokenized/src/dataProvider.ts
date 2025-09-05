import { Requester, Logger } from '@chainlink/ea-bootstrap'
import { Config } from './config'
import { AxiosRequestConfig } from '@chainlink/ea-bootstrap'

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
      'Authorization': `Bearer ${config.ondoApiKey}`,
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
  
  Logger.debug(`Activation check: now=${nowUTC}, activation=${activationDateTime}, shouldActivate=${shouldActivate}`)
  Logger.debug(`Using ${shouldActivate ? 'new' : 'current'} multiplier: ${activeMultiplier}`)
  
  return activeMultiplier
}

/**
 * Fetch underlying price from Chainlink Data Streams
 * Note: This is a placeholder implementation. In practice, you would integrate with
 * the actual Chainlink Data Streams API using the feedId.
 */
export const getDataStreamsPrice = async (
  feedId: string,
  _config: Config,
): Promise<number> => {
  // TODO: Implement actual Data Streams integration
  // This would typically involve:
  // 1. Making authenticated requests to Data Streams API
  // 2. Parsing the latest report for the given feedId
  // 3. Extracting the price value
  
  Logger.warn(`Data Streams integration not yet implemented for feedId: ${feedId}`)
  Logger.warn(`Using mock price data - replace with actual Data Streams implementation`)
  
  // Mock implementation - replace with actual Data Streams call
  const mockPrices: { [key: string]: number } = {
    'equities:TSLA:mid': 250.75,
    'equities:SPY:mid': 445.20,
    'equities:QQQ:mid': 385.90,
  }
  
  const price = mockPrices[feedId] || 100.0
  Logger.debug(`Mock price for ${feedId}: ${price}`)
  
  return price
}

/**
 * Calculate the final tokenized price with 8 decimal precision
 */
export const calculateTokenizedPrice = (underlyingPrice: number, activeMultiplier: number): string => {
  const tokenizedPrice = underlyingPrice * activeMultiplier
  
  // Round to 8 decimal places and return as string
  const result = tokenizedPrice.toFixed(8)
  
  Logger.debug(`Calculation: ${underlyingPrice} × ${activeMultiplier} = ${result}`)
  
  return result
}
