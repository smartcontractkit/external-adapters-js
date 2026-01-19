import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import {
  mockMarketResponse,
  mockMarketResponseClosed,
  mockMarketResponseSettledYes,
  mockMarketResponseSettledNo,
  mockMarketResponseUnknownStatus,
  mockMarketResponseEmpty,
  mockMarketResponseNullMarket,
  mockMarketResponseServerError,
} from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.KALSHI_API_KEY = process.env.KALSHI_API_KEY ?? 'fake-api-key'
    process.env.BACKGROUND_EXECUTE_MS = '0'

    const mockDate = new Date('2001-01-01T11:11:11.111Z')
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

  describe('market endpoint', () => {
    describe('happy path', () => {
      it('should return success for active market', async () => {
        const data = {
          market_ticker: 'KXUSIRATECUTS25MAR',
          endpoint: 'market',
        }
        mockMarketResponse()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should return success for closed market', async () => {
        const data = {
          market_ticker: 'CLOSEDMARKET',
          endpoint: 'market',
        }
        mockMarketResponseClosed()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should return success for settled market with yes result', async () => {
        const data = {
          market_ticker: 'SETTLEDYESMARKET',
          endpoint: 'market',
        }
        mockMarketResponseSettledYes()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should return success for settled market with no result', async () => {
        const data = {
          market_ticker: 'SETTLEDNOMARKET',
          endpoint: 'market',
        }
        mockMarketResponseSettledNo()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should use default endpoint when not specified', async () => {
        const data = {
          market_ticker: 'KXUSIRATECUTS25MAR',
        }
        mockMarketResponse()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })
    })

    describe('edge cases', () => {
      it('should handle unknown market status with status code 0', async () => {
        const data = {
          market_ticker: 'UNKNOWNSTATUSMARKET',
          endpoint: 'market',
        }
        mockMarketResponseUnknownStatus()
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
        const response = await testAdapter.request({ endpoint: 'market' })
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
      it('should handle empty response from provider', async () => {
        const data = {
          market_ticker: 'EMPTYMARKET',
          endpoint: 'market',
        }
        mockMarketResponseEmpty()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })

      it('should handle null market in response', async () => {
        const data = {
          market_ticker: 'NULLMARKET',
          endpoint: 'market',
        }
        mockMarketResponseNullMarket()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })

      it('should handle upstream server error', async () => {
        const data = {
          market_ticker: 'SERVERERRORMARKET',
          endpoint: 'market',
        }
        mockMarketResponseServerError()
        const response = await testAdapter.request(data)
        // Framework retries failed requests, so we get either 502 or 504 depending on retry state
        expect([502, 504]).toContain(response.statusCode)
        expect(response.json()).toMatchSnapshot()
      })
    })
  })
})
