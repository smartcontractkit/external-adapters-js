import { buildUrl, medianBigInt, parseDecimalString, parseUrls } from '../../src/utils'

describe('Utils', () => {
  describe('buildUrl', () => {
    it('should append path to simple base URL', () => {
      expect(buildUrl('https://api.example.com', '/app/endpoint')).toBe(
        'https://api.example.com/app/endpoint',
      )
    })

    it('should handle trailing slash in base URL', () => {
      expect(buildUrl('https://api.example.com/', '/app/endpoint')).toBe(
        'https://api.example.com/app/endpoint',
      )
    })

    it('should preserve query parameters', () => {
      expect(buildUrl('https://api.example.com?auth=TOKEN', '/app/endpoint')).toBe(
        'https://api.example.com/app/endpoint?auth=TOKEN',
      )
    })
  })

  describe('parseDecimalString', () => {
    it('should parse decimal with full precision', () => {
      expect(parseDecimalString('11.7127388', 10)).toBe(117127388000n)
    })

    it('should parse whole number', () => {
      expect(parseDecimalString('100', 8)).toBe(10000000000n)
    })

    it('should parse zero', () => {
      expect(parseDecimalString('0', 10)).toBe(0n)
    })
  })

  describe('parseUrls', () => {
    it('should parse single URL', () => {
      expect(parseUrls('https://attester1.api')).toEqual(['https://attester1.api'])
    })

    it('should parse multiple comma-separated URLs', () => {
      expect(
        parseUrls('https://attester1.api,https://attester2.api,https://attester3.api'),
      ).toEqual(['https://attester1.api', 'https://attester2.api', 'https://attester3.api'])
    })

    it('should trim whitespace around URLs', () => {
      expect(parseUrls('  https://a.api  ,  https://b.api  ')).toEqual([
        'https://a.api',
        'https://b.api',
      ])
    })

    it('should filter out empty strings', () => {
      expect(parseUrls('https://a.api,,https://b.api,')).toEqual(['https://a.api', 'https://b.api'])
    })

    it('should return empty array for empty string', () => {
      expect(parseUrls('')).toEqual([])
    })

    it('should handle 5 URLs', () => {
      const urls = 'https://a1.api,https://a2.api,https://a3.api,https://a4.api,https://a5.api'
      expect(parseUrls(urls)).toHaveLength(5)
    })
  })

  describe('medianBigInt', () => {
    it('should return single value for array of length 1', () => {
      expect(medianBigInt([100n])).toBe(100n)
    })

    it('should return lower middle for array of length 2', () => {
      expect(medianBigInt([100n, 200n])).toBe(100n)
    })

    it('should return middle value for odd-length array', () => {
      expect(medianBigInt([100n, 200n, 300n])).toBe(200n)
    })

    it('should return lower middle for even-length array of 4', () => {
      expect(medianBigInt([100n, 200n, 300n, 400n])).toBe(200n)
    })

    it('should correctly calculate median for 5 values', () => {
      expect(medianBigInt([500n, 100n, 300n, 200n, 400n])).toBe(300n)
    })

    it('should sort values before calculating median', () => {
      expect(medianBigInt([300n, 100n, 200n])).toBe(200n)
    })

    it('should throw for empty array', () => {
      expect(() => medianBigInt([])).toThrow('Cannot calculate median of empty array')
    })

    it('should handle large BigInt values', () => {
      const large1 = 50000000000000n
      const large2 = 60000000000000n
      const large3 = 70000000000000n
      expect(medianBigInt([large3, large1, large2])).toBe(large2)
    })
  })
})
