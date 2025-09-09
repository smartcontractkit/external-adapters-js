import { signRequest, toBigIntBalance, toEvenHex } from '../../src/transport/utils'

describe('utils', () => {
  describe('toBigIntBalance', () => {
    it('converts decimal string to bigint', () => {
      expect(toBigIntBalance('1', 18)).toBe(10n ** 18n)
      expect(toBigIntBalance('0.5', 18)).toBe(5n * 10n ** 17n)
    })

    it('handles zero and small decimals', () => {
      expect(toBigIntBalance('0', 18)).toBe(0n)
      expect(toBigIntBalance('0.000001', 18)).toBe(1000000000000n)
    })
  })

  describe('toEvenHex', () => {
    it('pads odd hex strings', () => {
      expect(toEvenHex(15n)).toBe('0x0f')
    })
    it('returns even hex unchanged', () => {
      expect(toEvenHex(16n)).toBe('0x10')
    })
    it('handles zero', () => {
      expect(toEvenHex(0n)).toBe('0x00')
    })
  })

  describe('signRequest', () => {
    it('creates deterministic signature', () => {
      const sig1 = signRequest('GET', '/wallets', '', 'apiKey', 'secret', { foo: 'bar' })
      const sig2 = signRequest('GET', '/wallets', '', 'apiKey', 'secret', { foo: 'bar' })
      expect(sig1).toEqual(sig2)
    })
  })
})
