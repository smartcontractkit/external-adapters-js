import {
  applyRateBounds,
  calculateNormalizedRate,
  calculateUnvestedAssets,
  parseRateBound,
  parseRateBounds,
} from '../../src/shared/exchange-rate-utils'

describe('exchange-rate-utils', () => {
  describe('parseRateBound', () => {
    it('should parse positive base-10 integer strings', () => {
      expect(parseRateBound('1000000000000000000', 'minRate')).toBe(1000000000000000000n)
    })

    it('should reject non-positive or non-canonical values', () => {
      expect(() => parseRateBound('0', 'minRate')).toThrow(
        'minRate must be a positive base-10 integer string',
      )
      expect(() => parseRateBound('-1', 'minRate')).toThrow(
        'minRate must be a positive base-10 integer string',
      )
      expect(() => parseRateBound('01', 'minRate')).toThrow(
        'minRate must be a positive base-10 integer string',
      )
      expect(() => parseRateBound('not-a-rate', 'minRate')).toThrow(
        'minRate must be a positive base-10 integer string',
      )
    })
  })

  describe('parseRateBounds', () => {
    it('should parse valid bounds', () => {
      expect(parseRateBounds('1', '2')).toEqual({ minRate: 1n, maxRate: 2n })
    })

    it('should reject inverted bounds', () => {
      expect(() => parseRateBounds('2', '1')).toThrow(
        'minRate must be less than or equal to maxRate',
      )
    })
  })

  describe('applyRateBounds', () => {
    it('should leave in-range rates unchanged', () => {
      expect(applyRateBounds(10n, 1n, 20n)).toEqual({ rate: 10n, boundsApplied: false })
    })

    it('should clamp below-minimum and above-maximum rates', () => {
      expect(applyRateBounds(10n, 11n, 20n)).toEqual({ rate: 11n, boundsApplied: true })
      expect(applyRateBounds(21n, 1n, 20n)).toEqual({ rate: 20n, boundsApplied: true })
    })
  })

  describe('calculateNormalizedRate', () => {
    it('should calculate an 18-decimal normalized rate', () => {
      expect(calculateNormalizedRate(1_500_000_000n, 1_000_000n, 9, 6)).toBe(
        1_500_000_000_000_000_000n,
      )
    })

    it('should return null when shares are zero', () => {
      expect(calculateNormalizedRate(1n, 0n, 6, 6)).toBeNull()
    })
  })

  describe('calculateUnvestedAssets', () => {
    it('should use direct unvested formula with floor rounding', () => {
      expect(calculateUnvestedAssets(10n, 1n, 0n, 3n)).toBe(6n)
    })

    it('should handle inactive, pending, complete, and empty vesting schedules', () => {
      expect(calculateUnvestedAssets(10n, 1n, 3n, 1n)).toBe(0n)
      expect(calculateUnvestedAssets(10n, 1n, 2n, 3n)).toBe(10n)
      expect(calculateUnvestedAssets(10n, 3n, 1n, 3n)).toBe(0n)
      expect(calculateUnvestedAssets(0n, 1n, 0n, 3n)).toBe(0n)
    })
  })
})
