import { calculateDaSupply } from '../../src/lib'
import { Instrument } from '../../src/types'
import { parseDecimalString } from '../../src/utils'

const createInstrument = (overrides: Partial<Instrument> = {}): Instrument => ({
  id: 'CBTC',
  name: 'CBTC',
  symbol: 'CBTC',
  totalSupply: '0',
  totalSupplyAsOf: null,
  decimals: 10,
  supportedApis: {},
  ...overrides,
})

describe('Canton Digital Assets Supply', () => {
  describe('parseDecimalString', () => {
    it('should parse a standard decimal value', () => {
      expect(parseDecimalString('11.7127388', 10)).toBe(117127388000n)
    })

    it('should parse a whole number', () => {
      expect(parseDecimalString('100', 8)).toBe(10000000000n)
    })

    it('should parse zero', () => {
      expect(parseDecimalString('0', 10)).toBe(0n)
    })

    it('should parse a tiny value (sub-unit precision)', () => {
      expect(parseDecimalString('0.0000000001', 10)).toBe(1n)
    })

    it('should parse a huge value exceeding MAX_SAFE_INTEGER', () => {
      expect(parseDecimalString('21000000', 10)).toBe(210000000000000000n)
    })

    it('should parse max supply with full 10 decimal precision', () => {
      expect(parseDecimalString('21000000.9999999999', 10)).toBe(210000009999999999n)
    })

    it('should truncate when input has more decimals than specified', () => {
      expect(parseDecimalString('1.123456789012345', 10)).toBe(11234567890n)
    })

    it('should truncate not round - value ending in 9s', () => {
      expect(parseDecimalString('1.99999999999', 10)).toBe(19999999999n)
    })

    it('should pad when input has fewer decimals than specified', () => {
      expect(parseDecimalString('1.25', 10)).toBe(12500000000n)
    })

    it('should handle 18 decimals (Ethereum standard)', () => {
      expect(parseDecimalString('1.5', 18)).toBe(1500000000000000000n)
    })

    it('should handle 8 decimals (Bitcoin standard)', () => {
      expect(parseDecimalString('21000000', 8)).toBe(2100000000000000n)
    })

    it('should handle extremely small fractional values', () => {
      expect(parseDecimalString('0.00000001', 10)).toBe(100n)
    })

    it('should handle value with trailing decimal point', () => {
      expect(parseDecimalString('100.', 10)).toBe(1000000000000n)
    })
  })

  describe('calculateDaSupply', () => {
    it('should calculate supply from API response', () => {
      const instruments = [createInstrument({ totalSupply: '11.7127388' })]
      expect(calculateDaSupply(instruments)).toBe('117127388000')
    })

    it('should handle different decimal configurations', () => {
      const instruments = [createInstrument({ totalSupply: '5.5', decimals: 8 })]
      expect(calculateDaSupply(instruments)).toBe('550000000')
    })

    it('should handle whole number supply', () => {
      const instruments = [createInstrument({ totalSupply: '100', decimals: 8 })]
      expect(calculateDaSupply(instruments)).toBe('10000000000')
    })

    it('should handle zero supply', () => {
      const instruments = [createInstrument({ totalSupply: '0' })]
      expect(calculateDaSupply(instruments)).toBe('0')
    })

    it('should handle very small supply values', () => {
      const instruments = [createInstrument({ totalSupply: '0.0000001' })]
      expect(calculateDaSupply(instruments)).toBe('1000')
    })

    it('should handle large supply without precision loss', () => {
      const instruments = [createInstrument({ totalSupply: '21000000' })]
      expect(calculateDaSupply(instruments)).toBe('210000000000000000')
    })

    it('should handle max supply with full decimal precision', () => {
      const instruments = [createInstrument({ totalSupply: '21000000.9999999999' })]
      expect(calculateDaSupply(instruments)).toBe('210000009999999999')
    })

    it('should truncate excess decimal places', () => {
      const instruments = [createInstrument({ totalSupply: '1.123456789012345' })]
      expect(calculateDaSupply(instruments)).toBe('11234567890')
    })

    it('should find CBTC among multiple instruments', () => {
      const instruments = [
        createInstrument({ symbol: 'OTHER', id: 'OTHER', totalSupply: '999' }),
        createInstrument({ totalSupply: '25.5' }),
      ]
      expect(calculateDaSupply(instruments)).toBe('255000000000')
    })

    it('should throw when no instruments found', () => {
      expect(() => calculateDaSupply([])).toThrow('No instruments found')
    })

    it('should throw when instruments is undefined', () => {
      expect(() => calculateDaSupply(undefined as unknown as Instrument[])).toThrow(
        'No instruments found',
      )
    })

    it('should throw when instruments is null', () => {
      expect(() => calculateDaSupply(null as unknown as Instrument[])).toThrow(
        'No instruments found',
      )
    })

    it('should throw when CBTC not found', () => {
      const instruments = [createInstrument({ symbol: 'OTHER', id: 'OTHER', name: 'Other' })]
      expect(() => calculateDaSupply(instruments)).toThrow('CBTC instrument not found')
    })

    it('should throw when CBTC totalSupply is empty string', () => {
      const instruments = [createInstrument({ totalSupply: '' })]
      expect(() => calculateDaSupply(instruments)).toThrow()
    })

    it('should throw when CBTC totalSupply is whitespace only', () => {
      const instruments = [createInstrument({ totalSupply: '   ' })]
      expect(() => calculateDaSupply(instruments)).toThrow()
    })

    it('should throw when CBTC totalSupply is invalid', () => {
      const instruments = [createInstrument({ totalSupply: 'invalid' })]
      expect(() => calculateDaSupply(instruments)).toThrow()
    })

    it('should throw when CBTC totalSupply is null', () => {
      const instruments = [createInstrument({ totalSupply: null as unknown as string })]
      expect(() => calculateDaSupply(instruments)).toThrow()
    })

    it('should throw when CBTC totalSupply is undefined', () => {
      const instruments = [createInstrument({ totalSupply: undefined as unknown as string })]
      expect(() => calculateDaSupply(instruments)).toThrow()
    })

    it('should throw when CBTC decimals is undefined', () => {
      const instruments = [
        createInstrument({ totalSupply: '100', decimals: undefined as unknown as number }),
      ]
      expect(() => calculateDaSupply(instruments)).toThrow()
    })

    it('should throw when CBTC decimals is negative', () => {
      const instruments = [createInstrument({ totalSupply: '100', decimals: -1 })]
      expect(() => calculateDaSupply(instruments)).toThrow()
    })
  })
})
