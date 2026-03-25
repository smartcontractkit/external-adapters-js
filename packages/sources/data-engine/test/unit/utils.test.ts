import { resolveResult, scaleDecimals } from '../../src/transport/utils'

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
    // Scaled to 0 decimals with truncated: 1 (truncated, not rounded to 2)
    expect(scaleDecimals('1999999999999999999', 18, 0)).toBe('1')
  })

  it('should return float with decimals when returnAs is "float"', () => {
    // 120950127609218450000000 / 10^(18-8) = 120950127609218450000000 / 10^10 = 12095012760921.845
    expect(scaleDecimals('120950127609218450000000', 18, 8, 'float')).toBe('12095012760921.845')
  })

  it('should return float with exact decimal places for "float" returnAs', () => {
    // 999999999999999999 with 18 decimals, scaled to 8 decimals
    // 999999999999999999 / 10^(18-8) = 999999999999999999 / 10^10 = 99999999.9999999999
    expect(scaleDecimals('999999999999999999', 18, 8, 'float')).toBe('99999999.9999999999')
  })

  it('should return float with 0 decimals when returnAs is "float" and toDecimals is 0', () => {
    // 1500000000000000000000 with 18 decimals = 1500.0
    // Scaled to 0 decimals with float returnAs: "1500"
    expect(scaleDecimals('1500000000000000000000', 18, 0, 'float')).toBe('1500')
  })
})

describe('resolveResult', () => {
  const data = { price: '120950127609218450000000', bid: '100000000000000000000', ask: '0' }

  it('returns null when resultPath is undefined', () => {
    expect(resolveResult(data, undefined)).toBeNull()
  })

  it('returns null when resultPath is empty string', () => {
    expect(resolveResult(data, '')).toBeNull()
  })

  it('returns stringified value when decimals is undefined', () => {
    expect(resolveResult(data, 'price')).toBe('120950127609218450000000')
  })

  it('applies scaleDecimals when decimals is provided', () => {
    expect(resolveResult(data, 'price', 8)).toBe('12095012760921')
  })

  it('scales when decimals is 0', () => {
    expect(resolveResult(data, 'bid', 0)).toBe('100')
  })

  it('throws when resultPath key does not exist in data', () => {
    expect(() => resolveResult(data, 'foo')).toThrow(
      "resultPath 'foo' not found in data. Available keys: price, bid, ask",
    )
  })

  it('handles numeric zero value in data', () => {
    expect(resolveResult(data, 'ask')).toBe('0')
  })

  it('returns int-truncated result for decimals > 0', () => {
    expect(resolveResult(data, 'price', 8)).toBe('12095012760921')
  })

  it('returns float result with all sig figs when decimals is 0', () => {
    expect(resolveResult(data, 'bid', 0)).toBe('100')
  })

  it('returns float result with decimals when returnAs is "float"', () => {
    expect(resolveResult(data, 'price', 8, 'float')).toBe('12095012760921.845')
  })

  it('returns float result with specified precision for "float" returnAs', () => {
    expect(resolveResult(data, 'bid', 2, 'float')).toBe('10000')
  })

  it('ignores returnAs when decimals is undefined', () => {
    expect(resolveResult(data, 'price', undefined, 'float')).toBe('120950127609218450000000')
  })
})
