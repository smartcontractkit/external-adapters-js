import {
  mockSuccessfulCoinMarketCapResponse,
  mockSuccessfulGlobalMetricsResponse,
  mockSuccessfulHistoricalCapResponse,
} from './fixtures'
import * as nock from 'nock'
import { TestAdapter, setEnvVariables } from '@chainlink/external-adapter-framework/util/test-util'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['API_KEY'] = 'fake-api-key'
    const mockDate = new Date('2022-01-01T11:11:11.111Z')
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

  describe('crypto endpoint with cid', () => {
    it('should return success', async () => {
      const data = {
        base: 'BTC',
        cid: '1',
        to: 'USD',
      }
      mockSuccessfulCoinMarketCapResponse('id', '1')
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('marketcap endpoint with slug', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'marketcap',
        base: 'BTC',
        slug: 'bitcoin',
        to: 'USD',
      }
      mockSuccessfulCoinMarketCapResponse('slug', 'bitcoin')
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('volume endpoint with base (override to id)', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'volume',
        base: 'BTC',
        to: 'USD',
      }
      mockSuccessfulCoinMarketCapResponse('id', '1')
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('globalmarketcap endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'globalmarketcap',
        market: 'USD',
      }
      mockSuccessfulGlobalMetricsResponse('USD')
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('dominance endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'dominance',
        market: 'BTC',
      }
      mockSuccessfulGlobalMetricsResponse()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('historical endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'historical',
        symbol: 'ETH',
        convert: 'BTC',
        start: '2021-07-23T14',
      }
      mockSuccessfulHistoricalCapResponse()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
