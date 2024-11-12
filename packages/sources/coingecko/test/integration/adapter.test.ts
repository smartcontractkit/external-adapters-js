import { mockCryptoSuccess, mockDominanceSuccess } from './fixtures'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    const mockDate = new Date('2022-05-10T16:09:27.193Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  describe('crypto api', () => {
    it('should return success', async () => {
      const data = {
        base: 'ETH',
        quote: 'USD',
      }
      mockCryptoSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success for override', async () => {
      const data = {
        base: 'OHMV2',
        quote: 'USD',
        overrides: {
          coingecko: {
            OHMV2: 'olympus',
          },
        },
      }
      mockCryptoSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return failure for array', async () => {
      const data = {
        base: ['OHMV2', 'ETH'],
        quote: 'USD',
        overrides: {
          coingecko: {
            OHMV2: 'olympus',
          },
        },
      }
      mockCryptoSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('volume api', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'volume',
        base: 'ETH',
        quote: 'USD',
      }
      mockCryptoSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('marketcap api', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'marketcap',
        base: 'ETH',
        quote: 'USD',
      }
      mockCryptoSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('globalmarketcap api', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'globalmarketcap',
        quote: 'USD',
      }
      mockDominanceSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('dominance api', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'dominance',
        quote: 'ETH',
      }
      mockDominanceSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
