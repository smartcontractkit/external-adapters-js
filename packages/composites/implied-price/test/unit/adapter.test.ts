import { Decimal } from 'decimal.js'
import { calculateMedian, normalizeInput, parseInput, parseSources } from '../../src/utils'

describe('Computed Price Utility Functions', () => {
  describe('calculateMedian', () => {
    it('should calculate median for odd number of values', () => {
      const values = [1, 3, 5]
      const result = calculateMedian(values)
      expect(Number(result.toFixed())).toBe(3)
    })

    it('should calculate median for even number of values', () => {
      const values = [1, 2, 3, 4]
      const result = calculateMedian(values)
      expect(Number(result.toFixed(1))).toBe(2.5) // (2 + 3) / 2 = 2.5
    })

    it('should handle single value', () => {
      const values = [42]
      const result = calculateMedian(values)
      expect(Number(result.toFixed())).toBe(42)
    })

    it('should handle two values', () => {
      const values = [10, 20]
      const result = calculateMedian(values)
      expect(Number(result.toFixed())).toBe(15) // (10 + 20) / 2 = 15
    })

    it('should throw error for empty array', () => {
      expect(() => calculateMedian([])).toThrow('Cannot calculate median of empty array')
    })

    it('should handle decimal precision correctly', () => {
      const values = [4400.1, 4400.2, 4399.8]
      const result = calculateMedian(values)
      expect(Number(result.toFixed(1))).toBe(4400.1)
    })

    it('should sort values before calculating median', () => {
      const values = [5, 1, 9, 3, 7] // Unsorted
      const result = calculateMedian(values)
      expect(Number(result.toFixed())).toBe(5) // Middle value when sorted: [1,3,5,7,9]
    })

    it('should handle negative values', () => {
      const values = [-10, -5, 0, 5, 10]
      const result = calculateMedian(values)
      expect(Number(result.toFixed())).toBe(0)
    })

    it('should return Decimal instance', () => {
      const values = [1, 2, 3]
      const result = calculateMedian(values)
      expect(result).toBeInstanceOf(Decimal)
    })
  })

  describe('normalizeInput', () => {
    it('should normalize from/to to base/quote', () => {
      const input = { from: 'ETH', to: 'USD' }
      const result = normalizeInput(input)
      expect(result).toEqual({
        from: 'ETH',
        to: 'USD',
        base: 'ETH',
        quote: 'USD',
      })
    })

    it('should preserve existing base/quote', () => {
      const input = { base: 'BTC', quote: 'USD' }
      const result = normalizeInput(input)
      expect(result).toEqual({ base: 'BTC', quote: 'USD' })
    })

    it('should not override existing base/quote with from/to', () => {
      const input = { from: 'ETH', to: 'USD', base: 'BTC', quote: 'EUR' }
      const result = normalizeInput(input)
      expect(result).toEqual({
        from: 'ETH',
        to: 'USD',
        base: 'BTC', // Should not be overwritten
        quote: 'EUR', // Should not be overwritten
      })
    })

    it('should preserve all other properties', () => {
      const input = {
        from: 'LINK',
        to: 'USD',
        overrides: {
          coingecko: {
            LINK: 'chainlink',
          },
        },
      }
      const result = normalizeInput(input)
      expect(result.overrides).toEqual(input.overrides)
      expect(result.from).toBe('LINK')
      expect(result.to).toBe('USD')
      expect(result.base).toBe('LINK') // Should be normalized
      expect(result.quote).toBe('USD') // Should be normalized
    })

    it('should handle only from parameter', () => {
      const input = { from: 'ETH' }
      const result = normalizeInput(input)
      expect(result).toEqual({
        from: 'ETH',
        base: 'ETH',
      })
    })

    it('should handle only to parameter', () => {
      const input = { to: 'USD' }
      const result = normalizeInput(input)
      expect(result).toEqual({
        to: 'USD',
        quote: 'USD',
      })
    })

    it('should throw error for null input', () => {
      expect(() => normalizeInput(null as any)).toThrow('Input cannot be null or undefined')
    })

    it('should throw error for undefined input', () => {
      expect(() => normalizeInput(undefined as any)).toThrow('Input cannot be null or undefined')
    })

    it('should handle empty object', () => {
      const input = {}
      const result = normalizeInput(input)
      expect(result).toEqual({})
    })
  })

  describe('parseSources', () => {
    it('should return array as-is', () => {
      const sources = ['coingecko', 'coinpaprika']
      const result = parseSources(sources)
      expect(result).toEqual(['coingecko', 'coinpaprika'])
      expect(result).not.toBe(sources) // Should return new array
    })

    it('should parse comma-delimited string', () => {
      const sources = 'coingecko,coinpaprika,coinbase'
      const result = parseSources(sources)
      expect(result).toEqual(['coingecko', 'coinpaprika', 'coinbase'])
    })

    it('should handle single source string', () => {
      const sources = 'coingecko'
      const result = parseSources(sources)
      expect(result).toEqual(['coingecko'])
    })

    it('should trim whitespace from comma-delimited strings', () => {
      const sources = ' coingecko , coinpaprika , coinbase '
      const result = parseSources(sources)
      expect(result).toEqual(['coingecko', 'coinpaprika', 'coinbase'])
    })

    it('should handle empty string', () => {
      const sources = ''
      const result = parseSources(sources)
      expect(result).toEqual([''])
    })

    it('should handle string with only commas', () => {
      const sources = ',,'
      const result = parseSources(sources)
      expect(result).toEqual(['', '', ''])
    })

    it('should handle mixed whitespace', () => {
      const sources = 'coingecko,  ,coinpaprika'
      const result = parseSources(sources)
      expect(result).toEqual(['coingecko', '', 'coinpaprika'])
    })

    it('should handle non-string types by converting to string', () => {
      const sources = 123 as any
      const result = parseSources(sources)
      expect(result).toEqual(['123'])
    })

    it('should preserve array reference behavior', () => {
      const sources1 = ['coingecko']
      const sources2 = ['coingecko']
      const result1 = parseSources(sources1)
      const result2 = parseSources(sources2)

      expect(result1).toEqual(result2)
      expect(result1).not.toBe(result2)
    })
  })

  describe('parseInput', () => {
    it('should handle object inputs directly', () => {
      const input = { base: 'ETH', quote: 'USD' }
      const result = parseInput(input, 'testInput')
      expect(result).toEqual({ base: 'ETH', quote: 'USD' })
    })

    it('should parse valid JSON string inputs', () => {
      const input = JSON.stringify({ base: 'BTC', quote: 'USD' })
      const result = parseInput(input, 'testInput')
      expect(result).toEqual({ base: 'BTC', quote: 'USD' })
    })

    it('should handle inputs with overrides', () => {
      const input = {
        base: 'LINK',
        quote: 'USD',
        overrides: {
          coingecko: { LINK: 'chainlink' },
        },
      }
      const result = parseInput(input, 'testInput')
      expect(result).toEqual(input)
    })

    it('should throw error for null/undefined inputs', () => {
      expect(() => parseInput(null, 'testInput')).toThrow('testInput is required')
      expect(() => parseInput(undefined, 'testInput')).toThrow('testInput is required')
    })

    it('should throw error for malformed JSON strings', () => {
      const input = '{"base": "ETH", "quote":}'
      expect(() => parseInput(input, 'testInput')).toThrow('Invalid JSON in testInput')
    })

    it('should throw error for non-object JSON (arrays)', () => {
      const input = JSON.stringify(['not', 'an', 'object'])
      expect(() => parseInput(input, 'testInput')).toThrow(
        'Invalid format in testInput: must be an object',
      )
    })

    it('should throw error for non-object JSON (primitives)', () => {
      const input = JSON.stringify('just a string')
      expect(() => parseInput(input, 'testInput')).toThrow(
        'Invalid format in testInput: must be an object',
      )
    })

    it('should throw error for invalid input types', () => {
      expect(() => parseInput(123, 'testInput')).toThrow(
        'testInput must be an object or valid JSON string',
      )
      expect(() => parseInput(true, 'testInput')).toThrow(
        'testInput must be an object or valid JSON string',
      )
    })

    it('should handle complex nested objects', () => {
      const input = {
        base: 'ETH',
        quote: 'USD',
        overrides: {
          coingecko: { ETH: 'ethereum' },
          coinpaprika: { ETH: 'eth-ethereum' },
        },
        metadata: {
          precision: 18,
          description: 'Ethereum',
        },
      }
      const result = parseInput(input, 'testInput')
      expect(result).toEqual(input)
    })

    it('should preserve all properties when parsing JSON strings', () => {
      const originalInput = {
        base: 'BTC',
        quote: 'USD',
        overrides: { coingecko: { BTC: 'bitcoin' } },
        customProperty: 'customValue',
      }
      const jsonString = JSON.stringify(originalInput)
      const result = parseInput(jsonString, 'testInput')
      expect(result).toEqual(originalInput)
    })
  })
})
