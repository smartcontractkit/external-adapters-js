import {
  dedupeAssets,
  median,
  toFixed,
  toNumFromDS,
  unwrapAsset,
} from '../../src/transport/shared/utils'

describe('shared utils', () => {
  describe('toFixed', () => {
    it('returns a string with correct precision', () => {
      expect(toFixed(0.62296417, 12)).toBe('622964170000000000')
      expect(toFixed(44.3422343, 8)).toBe('443422343000000000000000')
    })
  })

  describe('median', () => {
    it('returns center value for odd-length arrays', () => {
      expect(median([1, 2, 3, 4, 5])).toBe(3)
      expect(median([5, 1, 3])).toBe(3)
    })

    it('returns midpoint for even-length arrays', () => {
      expect(median([1, 2, 3, 4])).toBe(2.5)
      expect(median([5, 10, 15, 20])).toBe(12.5)
    })
  })

  describe('toNumFromDS', () => {
    it('divides DS ints by decimals using Decimal.js', () => {
      expect(toNumFromDS('2001000000000000000', 18)).toBe(2.001)
    })
  })

  describe('unwrapAsset', () => {
    it('normalizes known wrapped tokens', () => {
      expect(unwrapAsset('WBTC.b')).toBe('BTC')
      expect(unwrapAsset('WETH')).toBe('ETH')
      expect(unwrapAsset('USDC.e')).toBe('USDC')
    })

    it('returns original symbol for unknown wrappers', () => {
      expect(unwrapAsset('LINK')).toBe('LINK')
    })
  })

  describe('dedupeAssets', () => {
    it('removes duplicate symbols keeping first metadata occurrence', () => {
      const assets = dedupeAssets([
        { symbol: 'LINK', decimals: 18 },
        { symbol: 'LINK', decimals: 8 },
        { symbol: 'USDC', decimals: 6 },
      ])

      expect(assets).toEqual([
        { symbol: 'LINK', decimals: 18 },
        { symbol: 'USDC', decimals: 6 },
      ])
    })
  })
})
