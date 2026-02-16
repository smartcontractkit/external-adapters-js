import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockNavResponseCustomSymbol,
  mockNavResponseInternalServerError,
  mockNavResponseInvalidSymbol,
  mockNavResponseSuccess,
} from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_KEY = 'test-api-key'
    process.env.API_SECRET = 'test-api-secret'
    process.env.BACKGROUND_EXECUTE_MS = '0'
    process.env.CACHE_ENABLED = 'false'

    const mockDate = new Date('2026-02-13T12:00:00.000Z')
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

  afterEach(() => {
    nock.cleanAll()
  })

  describe('nav endpoint', () => {
    it('should return success with XAUM symbol', async () => {
      const data = {
        endpoint: 'nav',
        symbol: 'XAUM',
      }

      mockNavResponseSuccess()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error when API returns error response', async () => {
      const data = {
        endpoint: 'nav',
        symbol: 'UNKNOWN',
      }

      mockNavResponseInvalidSymbol()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should include timestamp from API response', async () => {
      const data = {
        endpoint: 'nav',
        symbol: 'XAUM',
      }

      mockNavResponseSuccess()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      const json = response.json()
      expect(json.timestamps.providerIndicatedTimeUnixMs).toBe(1770185497979)
    })

    it('should parse issue_price as a number', async () => {
      const data = {
        endpoint: 'nav',
        symbol: 'XAUM',
      }

      mockNavResponseSuccess()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      const json = response.json()
      expect(typeof json.result).toBe('number')
      expect(json.result).toBe(5115.355)
      expect(json.data.result).toBe(json.result)
    })

    it('should return error for internal server error response', async () => {
      const data = {
        endpoint: 'nav',
        symbol: 'XAUM_ERROR',
      }

      mockNavResponseInternalServerError()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      const json = response.json()
      expect(json.errorMessage).toBe('System busy, please try again later.')
    })

    it('should support custom symbol parameter', async () => {
      const data = {
        endpoint: 'nav',
        symbol: 'XAGU',
      }

      mockNavResponseCustomSymbol()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      const json = response.json()
      expect(json.result).toBe(28.5)
    })
  })
})
