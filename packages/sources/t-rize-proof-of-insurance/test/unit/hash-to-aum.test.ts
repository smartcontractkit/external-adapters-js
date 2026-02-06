import { hashToAum } from '../../src/transport/insurance-proof'

describe('hashToAum', () => {
  const TWO_POW_191 = BigInt(2) ** BigInt(191)

  describe('modulo constraint', () => {
    it('returns result less than 2^191 for typical hash input', () => {
      const result = hashToAum('0xabc123def456')
      const resultBigInt = BigInt(result)
      expect(resultBigInt < TWO_POW_191).toBe(true)
    })

    it('returns result less than 2^191 for long input', () => {
      const longInput = '0x' + 'a'.repeat(256)
      const result = hashToAum(longInput)
      const resultBigInt = BigInt(result)
      expect(resultBigInt < TWO_POW_191).toBe(true)
    })

    it('returns non-negative result', () => {
      const result = hashToAum('abc123def456')
      const resultBigInt = BigInt(result)
      expect(resultBigInt >= BigInt(0)).toBe(true)
    })
  })

  describe('expected output values', () => {
    it('returns correct aum for hex prefixed input', () => {
      const result = hashToAum('0xabc123def456')
      expect(result).toBe('394686563145051592141435390537358740558257698705448720389')
    })

    it('returns correct aum for empty string', () => {
      const result = hashToAum('')
      expect(result).toBe('661650753212112198971926867105880866744126160826975565909')
    })

    it('returns correct aum for plain alphanumeric input', () => {
      const result = hashToAum('abc123def456')
      expect(result).toBe('2996698555610174494108743074904418113288218334509149695686')
    })
  })
})
