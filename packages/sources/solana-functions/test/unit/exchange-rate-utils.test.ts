import {
  applyRateBounds,
  calculateNormalizedRate,
  calculateUnvestedAssets,
  toRateBounds,
  validateRateBound,
  validateRateBounds,
} from '../../src/shared/exchange-rate-utils'

describe('exchange-rate-utils', () => {
  describe('validateRateBound', () => {
    it('should accept positive base-10 integer strings', () => {
      expect(() => validateRateBound('1000000000000000000', 'minRate')).not.toThrow()
    })

    it('should reject non-positive or non-canonical values', () => {
      for (const value of ['0', '-1', '01', 'not-a-rate']) {
        expect(() => validateRateBound(value, 'minRate')).toThrow(
          'minRate must be a positive base-10 integer string',
        )
      }
    })
  })

  describe('toRateBounds', () => {
    it('should convert valid bounds', () => {
      expect(toRateBounds('1', '2')).toEqual({ minRate: 1n, maxRate: 2n })
    })

    it('should allow omitted bounds', () => {
      expect(toRateBounds(undefined, '2')).toEqual({ minRate: undefined, maxRate: 2n })
      expect(toRateBounds('1', undefined)).toEqual({ minRate: 1n, maxRate: undefined })
      expect(toRateBounds(undefined, undefined)).toEqual({
        minRate: undefined,
        maxRate: undefined,
      })
    })
  })

  describe('validateRateBounds', () => {
    it('should reject inverted bounds', () => {
      expect(() => validateRateBounds('2', '1')).toThrow(
        'minRate must be less than or equal to maxRate',
      )
    })
  })

  describe('applyRateBounds', () => {
    it('should leave in-range rates unchanged', () => {
      expect(applyRateBounds(10n, 1n, 20n)).toEqual({ rate: 10n, boundsApplied: false })
      expect(applyRateBounds(10n, undefined, undefined)).toEqual({
        rate: 10n,
        boundsApplied: false,
      })
    })

    it('should clamp below-minimum and above-maximum rates', () => {
      expect(applyRateBounds(10n, 11n, 20n)).toEqual({ rate: 11n, boundsApplied: true })
      expect(applyRateBounds(21n, 1n, 20n)).toEqual({ rate: 20n, boundsApplied: true })
      expect(applyRateBounds(10n, 11n, undefined)).toEqual({ rate: 11n, boundsApplied: true })
      expect(applyRateBounds(21n, undefined, 20n)).toEqual({ rate: 20n, boundsApplied: true })
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
