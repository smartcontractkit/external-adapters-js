import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockStockQuoteResponseFailure, mockStockQuoteResponseSuccess } from './fixtures'

describe('rest', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['API_KEY'] = 'fake-api-key'
    const mockDate = new Date('2022-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('../../src')).adapter
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

  describe('stock quote endpoint - success', () => {
    it('should return success for full symbol', async () => {
      const data = {
        endpoint: 'stock_quotes',
        base: 'AAPL',
      }
      mockStockQuoteResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return bid for missing ask', async () => {
      const data = {
        endpoint: 'stock_quotes',
        base: 'NO_ASK',
      }
      mockStockQuoteResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return ask for missing bid', async () => {
      const data = {
        endpoint: 'stock_quotes',
        base: 'NO_BID',
      }
      mockStockQuoteResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error for missing data', async () => {
      const data = {
        endpoint: 'stock_quotes',
        base: 'MISSING_DATA',
      }
      mockStockQuoteResponseFailure()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(504)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error for missing timestamp', async () => {
      const data = {
        endpoint: 'stock_quotes',
        base: 'MISSING_TIME',
      }
      mockStockQuoteResponseFailure()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error for negative number', async () => {
      const data = {
        endpoint: 'stock_quotes',
        base: 'NEGATIVE',
      }
      mockStockQuoteResponseFailure()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error for 0 volume', async () => {
      const data = {
        endpoint: 'stock_quotes',
        base: 'ZERO_VOLUME',
      }
      mockStockQuoteResponseFailure()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
