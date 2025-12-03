import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockNavResponseAuthenticationFailed,
  mockNavResponseExpiredTimestamp,
  mockNavResponseInternalServerError,
  mockNavResponseParamsMissing,
  mockNavResponseSignatureFailed,
  mockNavResponseSupplyQueryFailed,
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

  afterEach(() => {
    nock.cleanAll()
  })

  describe('nav endpoint error codes', () => {
    it('should handle params missing error - causes 504 (Error #1)', async () => {
      const data = {
        endpoint: 'nav',
        chainType: 'base',
        tokenName: 'rcusdc',
      }

      mockNavResponseParamsMissing()
      // Wait for background execution to attempt and fail

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(504)
      const json = response.json()
      expect(json.error).toBeDefined()
    })

    it('should handle expired timestamp error - causes 504 (Error #2)', async () => {
      const data = {
        endpoint: 'nav',
        chainType: 'arbitrum',
        tokenName: 'rcusd',
      }

      mockNavResponseExpiredTimestamp()
      await new Promise((resolve) => setTimeout(resolve, 300))

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(504)
      const json = response.json()
      expect(json.error).toBeDefined()
    })

    it('should handle authentication failed error - causes 504 (Error #3)', async () => {
      const data = {
        endpoint: 'nav',
        chainType: 'optimism',
        tokenName: 'rcusd',
      }

      mockNavResponseAuthenticationFailed()
      await new Promise((resolve) => setTimeout(resolve, 300))

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(504)
      const json = response.json()
      expect(json.error).toBeDefined()
    })

    it('should handle signature verification failed error - causes 504 (Error #4)', async () => {
      const data = {
        endpoint: 'nav',
        chainType: 'avalanche',
        tokenName: 'rcusd',
      }

      mockNavResponseSignatureFailed()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(504)
      const json = response.json()
      expect(json.error).toBeDefined()
    })

    it('should handle internal server error (Error #5)', async () => {
      const data = {
        endpoint: 'nav',
        chainType: 'polygon',
        tokenName: 'rcusdp',
      }

      mockNavResponseInternalServerError()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      const json = response.json()
      expect(json.errorMessage).toBe('System busy, please try again later.')
      expect(json).toMatchSnapshot()
    })

    it('should handle supply query failed error (Error #8)', async () => {
      const data = {
        endpoint: 'nav',
        chainType: 'ethereum',
        tokenName: 'rcusd',
      }

      mockNavResponseSupplyQueryFailed()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      const json = response.json()
      expect(json.errorMessage).toBe('internal error')
      expect(json).toMatchSnapshot()
    })
  })
})
