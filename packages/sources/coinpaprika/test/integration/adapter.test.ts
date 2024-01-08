import { mockCryptoResponseSuccess } from './fixtures'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    const mockDate = new Date('2022-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
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

  describe('crypto batch endpoint', () => {
    it('should return success', async () => {
      const data = {
        base: 'ETH',
        quote: 'USD',
      }
      mockCryptoResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('crypto volume endpoint', () => {
    it('should return success', async () => {
      const data = {
        base: 'ETH',
        quote: 'USD',
        endpoint: 'volume',
      }
      mockCryptoResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('crypto volume endpoint with custom resultPath', () => {
    it('should return success', async () => {
      const data = {
        base: 'ETH',
        quote: 'USD',
        endpoint: 'volume',
        resultPath: 'market_cap',
      }
      mockCryptoResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('crypto marketcap endpoint', () => {
    it('should return success', async () => {
      const data = {
        base: 'ETH',
        quote: 'USD',
        endpoint: 'marketcap',
      }
      mockCryptoResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('dominance endpoint', () => {
    it('should return success', async () => {
      const data = {
        market: 'BTC',
        endpoint: 'dominance',
      }
      mockCryptoResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('globalmarketcap endpoint', () => {
    it('should return success', async () => {
      const data = {
        market: 'USD',
        endpoint: 'globalmarketcap',
      }
      mockCryptoResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('vwap endpoint', () => {
    it('should return success', async () => {
      const data = {
        base: 'ETH',
        endpoint: 'vwap',
      }
      mockCryptoResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
