import { toNumber } from '../../src/utils'

describe('utils', () => {
  describe('toNumber', () => {
    it('should return number when input is already a number', () => {
      expect(toNumber(42)).toBe(42)
      expect(toNumber(3.14)).toBe(3.14)
      expect(toNumber(0)).toBe(0)
      expect(toNumber(-10)).toBe(-10)
    })

    it('should convert valid string numbers to numbers', () => {
      expect(toNumber('42')).toBe(42)
      expect(toNumber('3.14')).toBe(3.14)
      expect(toNumber('0')).toBe(0)
      expect(toNumber('-10')).toBe(-10)
      expect(toNumber('  123  ')).toBe(123) // with whitespace
    })

    it('should return NaN for invalid string inputs', () => {
      expect(toNumber('not a number')).toBe(NaN)
      expect(toNumber('abc123')).toBe(NaN)
      expect(toNumber('')).toBe(NaN)
      expect(toNumber('   ')).toBe(NaN) // only whitespace
    })

    it('should return NaN for null and undefined inputs', () => {
      expect(toNumber(null)).toBe(NaN)
      expect(toNumber(undefined)).toBe(NaN)
    })

    it('should handle edge cases consistently', () => {
      // Our implementation treats non-finite numbers as NaN for safety
      expect(toNumber('Infinity')).toBe(NaN)
      expect(toNumber('-Infinity')).toBe(NaN)
      expect(toNumber('NaN')).toBe(NaN)
    })

    it('should handle very large numbers correctly', () => {
      expect(Number.isFinite(toNumber('1e308'))).toBe(true) // large but finite
      expect(toNumber('1e400')).toBe(NaN) // becomes Infinity, but we return NaN for safety
    })
  })
})
