import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockResponseSuccess } from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())
    process.env.API_KEY = process.env.API_KEY ?? 'test-api-key'
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

  describe('market endpoint', () => {
    describe('happy path', () => {
      it('should return success for active market', async () => {
        const data = {
          market_ticker: 'KXUSIRATECUTS25MAR',
          endpoint: 'market',
        }
        mockResponseSuccess()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should return success for closed market with yes result', async () => {
        const data = {
          market_ticker: 'PRESWIN24',
          endpoint: 'market',
        }
        mockResponseSuccess()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should return success for settled market with no result', async () => {
        const data = {
          market_ticker: 'GDP2024Q4',
          endpoint: 'market',
        }
        mockResponseSuccess()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should use default endpoint when not specified', async () => {
        const data = {
          market_ticker: 'KXUSIRATECUTS25MAR',
        }
        mockResponseSuccess()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })
    })

    describe('validation errors', () => {
      it('should fail on empty request', async () => {
        const response = await testAdapter.request({})
        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchSnapshot()
      })

      it('should fail on missing market_ticker', async () => {
        const response = await testAdapter.request({
          endpoint: 'market',
        })
        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchSnapshot()
      })

      it('should fail on invalid endpoint', async () => {
        const response = await testAdapter.request({
          market_ticker: 'KXUSIRATECUTS25MAR',
          endpoint: 'invalid_endpoint',
        })
        expect(response.statusCode).toBe(404)
        expect(response.json()).toMatchSnapshot()
      })
    })

    describe('upstream failures', () => {
      it('should handle 404 not found error', async () => {
        const data = {
          market_ticker: 'INVALID_TICKER',
          endpoint: 'market',
        }
        mockResponseSuccess()
        await testAdapter.request(data)
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })

      it('should handle empty response from upstream', async () => {
        const data = {
          market_ticker: 'EMPTY_MARKET',
          endpoint: 'market',
        }
        mockResponseSuccess()
        await testAdapter.request(data)
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })

      it('should handle 500 server error', async () => {
        const data = {
          market_ticker: 'SERVER_ERROR',
          endpoint: 'market',
        }
        mockResponseSuccess()
        await testAdapter.request(data)
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })

      it('should handle 401 unauthorized error', async () => {
        const data = {
          market_ticker: 'UNAUTHORIZED',
          endpoint: 'market',
        }
        mockResponseSuccess()
        await testAdapter.request(data)
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })
    })
  })
})
