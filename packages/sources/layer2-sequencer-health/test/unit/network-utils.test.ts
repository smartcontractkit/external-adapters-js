import { Networks } from '../../src/config'
import {
  errorMessagePaths,
  getErrorMessageFromPath,
  matchesExpectedError,
  race,
  sequencerOnlineErrors,
} from '../../src/network'

describe('network utils', () => {
  describe('matchesExpectedError', () => {
    it('returns true when actual error contains expected error', () => {
      expect(matchesExpectedError('gas price too low: 123', ['gas price too low'])).toBe(true)
    })

    it('returns true when actual error matches one of multiple expected errors', () => {
      const expectedErrors = ['error1', 'error2', 'error3']
      expect(matchesExpectedError('prefix error2 suffix', expectedErrors)).toBe(true)
    })

    it('returns false when actual error does not contain any expected error', () => {
      expect(matchesExpectedError('unknown error', ['gas price too low'])).toBe(false)
    })

    it('returns false for empty actual error', () => {
      expect(matchesExpectedError('', ['gas price too low'])).toBe(false)
    })

    it('returns false for empty expected errors array', () => {
      expect(matchesExpectedError('gas price too low', [])).toBe(false)
    })

    it('is case sensitive', () => {
      expect(matchesExpectedError('GAS PRICE TOO LOW', ['gas price too low'])).toBe(false)
    })
  })

  describe('getErrorMessageFromPath', () => {
    it('extracts message from nested error object', () => {
      const error = { error: { message: 'test error' } }
      expect(getErrorMessageFromPath(error, ['error', 'message'])).toBe('test error')
    })

    it('extracts message from deeply nested path', () => {
      const error = { error: { error: { message: 'deep error' } } }
      expect(getErrorMessageFromPath(error, ['error', 'error', 'message'])).toBe('deep error')
    })

    it('returns empty string for non-existent path', () => {
      const error = { error: { code: 123 } }
      expect(getErrorMessageFromPath(error, ['error', 'message'])).toBe('')
    })

    it('extracts message from top-level', () => {
      const error = { message: 'top level error' }
      expect(getErrorMessageFromPath(error, ['message'])).toBe('top level error')
    })

    it('returns empty string for null or undefined', () => {
      expect(getErrorMessageFromPath(null, ['message'])).toBe('')
      expect(getErrorMessageFromPath(undefined, ['message'])).toBe('')
    })
  })

  describe('sequencerOnlineErrors', () => {
    it('has expected errors defined for Arbitrum', () => {
      expect(sequencerOnlineErrors[Networks.Arbitrum]).toContain('gas price too low')
      expect(sequencerOnlineErrors[Networks.Arbitrum]).toContain('forbidden sender address')
      expect(sequencerOnlineErrors[Networks.Arbitrum]).toContain('intrinsic gas too low')
    })

    it('has expected errors defined for Optimism', () => {
      expect(sequencerOnlineErrors[Networks.Optimism]).toContain(
        'cannot accept 0 gas price transaction',
      )
    })

    it('has expected errors defined for Starkware', () => {
      expect(sequencerOnlineErrors[Networks.Starkware]).toContain('Contract not found')
      expect(sequencerOnlineErrors[Networks.Starkware]).toContain('Known(OutOfRangeFee)')
    })

    it('has expected errors defined for all networks', () => {
      const networks = Object.values(Networks)
      networks.forEach((network) => {
        expect(sequencerOnlineErrors[network]).toBeDefined()
        expect(Array.isArray(sequencerOnlineErrors[network])).toBe(true)
        expect(sequencerOnlineErrors[network].length).toBeGreaterThan(0)
      })
    })
  })

  describe('errorMessagePaths', () => {
    it('defines standard path for most EVM networks', () => {
      const evmNetworks = [
        Networks.Arbitrum,
        Networks.Optimism,
        Networks.Base,
        Networks.Linea,
        Networks.Metis,
        Networks.zkSync,
        Networks.Ink,
        Networks.Mantle,
        Networks.Unichain,
        Networks.Soneium,
        Networks.Celo,
        Networks.Xlayer,
        Networks.Megaeth,
        Networks.Katana,
      ]
      evmNetworks.forEach((network) => {
        expect(errorMessagePaths[network]).toEqual(['error', 'message'])
      })
    })

    it('defines nested path for Scroll', () => {
      expect(errorMessagePaths[Networks.Scroll]).toEqual(['error', 'error', 'message'])
    })

    it('defines top-level path for Starkware', () => {
      expect(errorMessagePaths[Networks.Starkware]).toEqual(['message'])
    })
  })

  describe('race', () => {
    it('resolves with promise value when promise resolves before timeout', async () => {
      const result = await race({
        promise: Promise.resolve('success'),
        timeout: 1000,
        error: 'Timeout error',
      })
      expect(result).toBe('success')
    })

    it('rejects with error message when timeout occurs', async () => {
      const slowPromise = new Promise((resolve) => setTimeout(resolve, 1000, 'slow'))
      await expect(
        race({
          promise: slowPromise,
          timeout: 10,
          error: 'Timeout error',
        }),
      ).rejects.toBe('Timeout error')
    })

    it('propagates promise rejection', async () => {
      const failingPromise = Promise.reject(new Error('Promise failed'))
      await expect(
        race({
          promise: failingPromise,
          timeout: 1000,
          error: 'Timeout error',
        }),
      ).rejects.toThrow('Promise failed')
    })
  })
})
