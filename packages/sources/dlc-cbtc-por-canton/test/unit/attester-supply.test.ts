import { calculateAttesterSupply } from '../../src/lib'
import { AttesterResponse } from '../../src/types'

const createResponse = (overrides: Partial<AttesterResponse> = {}): AttesterResponse => ({
  status: 'ready',
  total_supply_cbtc: '7.899823260000001',
  last_updated: '2025-12-19T17:04:07.328982+00:00',
  ...overrides,
})

describe('Attester Supply', () => {
  describe('calculateAttesterSupply', () => {
    // Valid responses
    it('should calculate supply from API response', () => {
      const response = createResponse()
      expect(calculateAttesterSupply(response)).toBe('78998232600')
    })

    it('should handle whole number supply', () => {
      const response = createResponse({ total_supply_cbtc: '100' })
      expect(calculateAttesterSupply(response)).toBe('1000000000000')
    })

    it('should handle zero supply', () => {
      const response = createResponse({ total_supply_cbtc: '0' })
      expect(calculateAttesterSupply(response)).toBe('0')
    })

    it('should handle very small supply values', () => {
      const response = createResponse({ total_supply_cbtc: '0.0000000001' })
      expect(calculateAttesterSupply(response)).toBe('1')
    })

    it('should handle large supply without precision loss', () => {
      const response = createResponse({ total_supply_cbtc: '21000000' })
      expect(calculateAttesterSupply(response)).toBe('210000000000000000')
    })

    it('should handle max supply with full decimal precision', () => {
      const response = createResponse({ total_supply_cbtc: '21000000.9999999999' })
      expect(calculateAttesterSupply(response)).toBe('210000009999999999')
    })

    it('should truncate excess decimal places', () => {
      const response = createResponse({ total_supply_cbtc: '1.123456789012345' })
      expect(calculateAttesterSupply(response)).toBe('11234567890')
    })

    it('should truncate not round - value ending in 9s', () => {
      const response = createResponse({ total_supply_cbtc: '1.99999999999' })
      expect(calculateAttesterSupply(response)).toBe('19999999999')
    })

    // Status validation
    it('should throw when status is not ready', () => {
      const response = createResponse({ status: 'pending' })
      expect(() => calculateAttesterSupply(response)).toThrow('Attester not ready: status=pending')
    })

    it('should throw when status is initializing', () => {
      const response = createResponse({ status: 'initializing' })
      expect(() => calculateAttesterSupply(response)).toThrow('Attester not ready')
    })

    // Missing/invalid total_supply_cbtc
    it('should throw when total_supply_cbtc is empty string', () => {
      const response = createResponse({ total_supply_cbtc: '' })
      expect(() => calculateAttesterSupply(response)).toThrow(
        'total_supply_cbtc is missing or empty',
      )
    })

    it('should throw when total_supply_cbtc is whitespace only', () => {
      const response = createResponse({ total_supply_cbtc: '   ' })
      expect(() => calculateAttesterSupply(response)).toThrow(
        'total_supply_cbtc is missing or empty',
      )
    })

    it('should throw when total_supply_cbtc is null', () => {
      const response = createResponse({ total_supply_cbtc: null as unknown as string })
      expect(() => calculateAttesterSupply(response)).toThrow()
    })

    it('should throw when total_supply_cbtc is undefined', () => {
      const response = createResponse({ total_supply_cbtc: undefined as unknown as string })
      expect(() => calculateAttesterSupply(response)).toThrow()
    })

    it('should throw when total_supply_cbtc is invalid numeric format', () => {
      const response = createResponse({ total_supply_cbtc: 'invalid' })
      expect(() => calculateAttesterSupply(response)).toThrow()
    })
  })
})
