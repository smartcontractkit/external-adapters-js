import { JsonRpcProvider } from 'ethers'
import { getUSDRate, scale, toUsd } from '../../src/transport/rate'

jest.mock('ethers', () => {
  const actualEthers = jest.requireActual('ethers')
  return {
    ethers: {
      JsonRpcProvider: function (): JsonRpcProvider {
        return {} as JsonRpcProvider
      },
      Contract: function (address: string) {
        if (address == '0x0') {
          return {
            decimals: jest.fn().mockImplementation(() => {
              return 1
            }),
            latestAnswer: jest.fn().mockImplementation(() => {
              return 50n
            }),
          }
        } else if (address == '0x1') {
          return {
            decimals: jest.fn().mockImplementation(() => {
              return 2
            }),
            latestAnswer: jest.fn().mockImplementation(() => {
              return 200n
            }),
          }
        } else if (address == '0x2') {
          return {
            decimals: jest.fn().mockImplementation(() => {
              return 3
            }),
            latestAnswer: jest.fn().mockImplementation(() => {
              return 4000n
            }),
          }
        } else {
          throw new Error(`${address} not mocked`)
        }
      },
    },
    parseUnits: actualEthers.parseUnits,
  }
})

describe('rate.ts', () => {
  describe('scale function', () => {
    it('going down', () => {
      const value = 1000000n
      const decimals = { from: 6, to: 2 }
      const result = scale(value, decimals)
      expect(result).toBe(100n)
    })
    it('going up', () => {
      const value = 100n
      const decimals = { from: 2, to: 6 }
      const result = scale(value, decimals)
      expect(result).toBe(1000000n)
    })
    it('no change', () => {
      const value = 100n
      const decimals = { from: 2, to: 2 }
      const result = scale(value, decimals)
      expect(result).toBe(100n)
    })
    it('zero', () => {
      const value = 0n
      const decimals = { from: 20, to: 2 }
      const result = scale(value, decimals)
      expect(result).toBe(0n)
    })
  })

  describe('getUSDRate function', () => {
    it('success', async () => {
      const result = await getUSDRate('0x0', {} as JsonRpcProvider)

      expect(result).toEqual({
        value: 50n,
        decimal: 1,
      })
    })
  })

  describe('toUsd function', () => {
    const mockContracts = {
      BTC: '0x0',
      ETH: '0x1',
      USDC: '0x2',
    }
    const mockProvider = {} as JsonRpcProvider

    it('should convert multiple coins to USD', async () => {
      const coins = [
        { coin: 'btc', amount: '1.0' },
        { coin: 'ETH', amount: '2.5' },
        { coin: 'USDC', amount: '100.1' },
      ]

      const result = await toUsd(coins, mockContracts, mockProvider)

      expect(result).toStrictEqual([
        {
          coin: 'BTC',
          amount: '1.0',
          rate: 50n,
          decimal: 1,
          value: 50n,
        },
        {
          coin: 'ETH',
          amount: '2.5',
          rate: 200n,
          decimal: 2,
          value: 500n,
        },
        {
          coin: 'USDC',
          amount: '100.1',
          rate: 4000n,
          decimal: 3,
          value: 400400n,
        },
      ])
    })

    it('should throw error for missing coin in contracts', async () => {
      const coins = [{ coin: 'DOGE', amount: '1.0' }]
      await expect(toUsd(coins, mockContracts, mockProvider)).rejects.toThrow(
        'DOGE is missing from ["BTC","ETH","USDC"]',
      )
    })
  })
})
