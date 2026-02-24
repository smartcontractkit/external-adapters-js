import { Decimal } from 'decimal.js'

Decimal.set({ precision: 50 })

export interface Allocation {
  symbol: string
  decimals: number
  balance: string
}

export interface TokenAllocationResponse {
  data: {
    result: number | string
  }
  result: number | string
  statusCode: number
}

/**
 * Converts a numeric result from the token-allocation adapter to a number using Decimal.js
 * for high precision handling to avoid floating point issues.
 *
 * @param result - The result value from token-allocation adapter (number or string)
 * @returns The result as a number
 */
export const parseTokenAllocationResult = (result: number | string): number => {
  return new Decimal(result).toNumber()
}

/**
 * Builds the request configuration for the token-allocation adapter.
 *
 * @param adapterUrl - The URL of the token-allocation adapter
 * @param allocations - The allocations to price
 * @param source - The price source to use (e.g., 'coingecko', 'coinmarketcap')
 * @returns The request configuration object
 */
export const buildTokenAllocationRequest = (
  adapterUrl: string,
  allocations: Allocation[],
  source: string,
): {
  url: string
  method: string
  data: {
    data: {
      allocations: Allocation[]
      quote: string
      method: string
      source: string
    }
  }
} => {
  return {
    url: adapterUrl,
    method: 'POST',
    data: {
      data: {
        allocations,
        quote: 'USD',
        method: 'price',
        source,
      },
    },
  }
}

/**
 * Builds an allocation object from token data retrieved from the blockchain.
 *
 * @param symbol - The token symbol
 * @param decimals - The token decimals
 * @param balance - The token balance as a string
 * @returns An Allocation object
 */
export const buildAllocation = (symbol: string, decimals: number, balance: string): Allocation => {
  return {
    symbol,
    decimals,
    balance,
  }
}

/**
 * Builds the response object for empty allocations scenario.
 *
 * @param providerDataRequestedUnixMs - Timestamp when data was requested
 * @returns The adapter response for empty allocations
 */
export const buildEmptyAllocationsResponse = (
  providerDataRequestedUnixMs: number,
): {
  data: { result: number }
  result: number
  statusCode: number
  timestamps: {
    providerDataRequestedUnixMs: number
    providerDataReceivedUnixMs: number
    providerIndicatedTimeUnixMs: undefined
  }
} => {
  return {
    data: {
      result: 0,
    },
    result: 0,
    statusCode: 200,
    timestamps: {
      providerDataRequestedUnixMs,
      providerDataReceivedUnixMs: Date.now(),
      providerIndicatedTimeUnixMs: undefined,
    },
  }
}

/**
 * Builds the success response object with the calculated index value.
 *
 * @param indexValue - The calculated index NAV value
 * @param providerDataRequestedUnixMs - Timestamp when data was requested
 * @returns The adapter response for successful calculation
 */
export const buildSuccessResponse = (
  indexValue: number,
  providerDataRequestedUnixMs: number,
): {
  data: { result: number }
  result: number
  statusCode: number
  timestamps: {
    providerDataRequestedUnixMs: number
    providerDataReceivedUnixMs: number
    providerIndicatedTimeUnixMs: undefined
  }
} => {
  return {
    data: {
      result: indexValue,
    },
    result: indexValue,
    statusCode: 200,
    timestamps: {
      providerDataRequestedUnixMs,
      providerDataReceivedUnixMs: Date.now(),
      providerIndicatedTimeUnixMs: undefined,
    },
  }
}

/**
 * Builds an error response object.
 *
 * @param errorMessage - The error message
 * @returns The adapter error response
 */
export const buildErrorResponse = (
  errorMessage: string,
): {
  statusCode: number
  errorMessage: string
  timestamps: {
    providerDataRequestedUnixMs: number
    providerDataReceivedUnixMs: number
    providerIndicatedTimeUnixMs: undefined
  }
} => {
  return {
    statusCode: 502,
    errorMessage,
    timestamps: {
      providerDataRequestedUnixMs: 0,
      providerDataReceivedUnixMs: 0,
      providerIndicatedTimeUnixMs: undefined,
    },
  }
}
