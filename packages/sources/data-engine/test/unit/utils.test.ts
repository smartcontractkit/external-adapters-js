import { scaleDecimals } from '../../src/transport/utils'

describe('scaleDecimals', () => {
  it('should scale down from 18 to 8 decimals', () => {
    // 120950127609218450000000 with 18 decimals = 120950.127609218450000000
    // Scaled to 8 decimals: 120950.12760921 → 12095012760921 (truncated, not rounded)
    expect(scaleDecimals('120950127609218450000000', 18, 8)).toBe('12095012760921')
  })

  it('should return same value when fromDecimals equals toDecimals', () => {
    expect(scaleDecimals('123456', 18, 18)).toBe('123456')
  })

  it('should scale up from 8 to 18 decimals', () => {
    expect(scaleDecimals('12095012760', 8, 18)).toBe('120950127600000000000')
  })

  it('should truncate (floor toward zero) when scaling down', () => {
    // 999999999999999999 with 18 decimals = 0.999999999999999999
    // Scaled to 8 decimals: 0.99999999 → integer representation = 99999999
    expect(scaleDecimals('999999999999999999', 18, 8)).toBe('99999999')
  })

  it('should handle zero value', () => {
    expect(scaleDecimals('0', 18, 8)).toBe('0')
  })

  it('should handle scale to 0 decimals', () => {
    // 1500000000000000000000 with 18 decimals = 1500.000000000000000000
    // Scaled to 0 decimals = 1500
    expect(scaleDecimals('1500000000000000000000', 18, 0)).toBe('1500')
  })

  it('should truncate toward zero for positive values', () => {
    // 1999999999999999999 with 18 decimals = 1.999999999999999999
    // Scaled to 0 decimals = 1 (truncated, not rounded to 2)
    expect(scaleDecimals('1999999999999999999', 18, 0)).toBe('1')
  })
})
