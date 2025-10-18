import Decimal from 'decimal.js'

export interface PriceInput {
  base?: string
  quote?: string
  from?: string
  to?: string
  overrides?: Record<string, Record<string, string>>
}

/**
 * Parses source adapters from various input formats
 * Supports both string arrays and comma-delimited strings
 */
export const parseSources = (sources: string | string[]): string[] => {
  if (Array.isArray(sources)) {
    return [...sources]
  }
  if (typeof sources === 'string') {
    return sources.split(',').map((source) => source.trim())
  }
  return String(sources)
    .split(',')
    .map((source) => source.trim())
}

/**
 * Normalizes input parameters to support different parameter formats
 * Converts from/to to base/quote while preserving existing base/quote
 */
export const normalizeInput = (input: PriceInput): PriceInput => {
  if (!input) {
    throw new Error('Input cannot be null or undefined')
  }

  const normalized = { ...input }

  // Convert from/to format to base/quote format if needed
  if (input.from && !input.base) {
    normalized.base = input.from
  }
  if (input.to && !input.quote) {
    normalized.quote = input.to
  }

  return normalized
}

/**
 * Calculates median value from an array of numbers using high-precision arithmetic
 */
export const calculateMedian = (values: number[]): Decimal => {
  if (values.length === 0) {
    throw new Error('Cannot calculate median of empty array')
  }

  const sortedValues = [...values].sort((a, b) => a - b)
  const middleIndex = Math.floor(sortedValues.length / 2)

  if (sortedValues.length % 2 === 0) {
    return new Decimal(sortedValues[middleIndex - 1]).add(sortedValues[middleIndex]).div(2)
  } else {
    return new Decimal(sortedValues[middleIndex])
  }
}

/**
 * Creates a unique request key for coalescing purposes
 */
export function createRequestKey(source: string, input: PriceInput): string {
  const normalizedInput = normalizeInput(input)
  const key = JSON.stringify({ source, input: normalizedInput })
  return Buffer.from(key).toString('base64')
}

/**
 * Safely parses input from various formats (object, JSON string, etc.)
 * Handles different input formats for maximum flexibility
 */
export function parseInput(input: any, fieldName: string): PriceInput {
  // Handle null/undefined
  if (input == null) {
    throw new Error(`${fieldName} is required`)
  }

  // Handle object input (direct objects)
  if (typeof input === 'object' && !Array.isArray(input)) {
    return input as PriceInput
  }

  // Handle JSON string input
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input)
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as PriceInput
      }
      throw new Error(`Invalid format in ${fieldName}: must be an object`)
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in ${fieldName}: ${error.message}`)
      }
      throw error
    }
  }

  throw new Error(`${fieldName} must be an object or valid JSON string`)
}
