import { dedupeAssets, unwrapAsset } from '../../src/transport/shared/utils'

describe('GM utils', () => {
  describe('unwrapAsset', () => {
    it('strips wrapped prefixes', () => {
      expect(unwrapAsset('WBTC.b')).toBe('BTC')
      expect(unwrapAsset('WETH')).toBe('ETH')
      expect(unwrapAsset('USDC.e')).toBe('USDC')
    })

    it('returns original symbol for unknown wrappers', () => {
      expect(unwrapAsset('LINK')).toBe('LINK')
    })
  })

  describe('dedupeAssets', () => {
    it('removes duplicate symbols keeping first metadata', () => {
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
