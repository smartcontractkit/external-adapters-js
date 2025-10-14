import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockErrorResponseFailure,
  mockHappyPathResponseSuccess,
  mockResponseFailure,
  mockValue0ResponseSuccess,
} from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.TEST_INTEGRATION_API_KEY = 'fake-api-key'
    process.env.TEST_INTEGRATION_API_URL = 'https://dataproviderapi.com/test-integration/nav'
    process.env.TEST_0_VAL_API_KEY = 'fake-api-key'
    process.env.TEST_0_VAL_API_URL = 'https://dataproviderapi.com/test-0-val/nav'
    process.env.MISSING_VALUE_INTEGRATION_API_KEY = 'fake-api-key'
    process.env.MISSING_VALUE_INTEGRATION_API_URL =
      'https://dataproviderapi.com/missing-value-integration/nav'
    process.env.ERROR_RESPONSE_API_KEY = 'fake-api-key'
    process.env.ERROR_RESPONSE_API_URL = 'https://dataproviderapi.com/error-response/nav'
    process.env.INCORRECT_API_URL_API_KEY = 'fake-api-key'
    process.env.INCORRECT_API_URL_API_URL = 'http://dataproviderapi.com/http/nav'
    process.env.BACKGROUND_EXECUTE_MS_HTTP = '1'

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

  describe('nav endpoint', () => {
    it('should return success', async () => {
      const data = {
        integration: 'test-integration',
        endpoint: 'nav',
      }
      mockHappyPathResponseSuccess(data.integration)
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
    it('value: 0 should be valid', async () => {
      const data = {
        integration: 'test-0-val',
        endpoint: 'nav',
      }
      mockValue0ResponseSuccess(data.integration)
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
    it('should handle missing value failure', async () => {
      const data = {
        integration: 'missing-value-integration',
        endpoint: 'nav',
      }
      mockResponseFailure(data.integration)
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
    it('should handle error response', async () => {
      const data = {
        integration: 'error-response',
        endpoint: 'nav',
      }
      mockErrorResponseFailure(data.integration)
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
    it('should handle missing env var', async () => {
      const data = {
        integration: 'missing-env-var',
        endpoint: 'nav',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(500)
      expect(response.json()).toMatchSnapshot()
    })
    it('should handle non https api url error', async () => {
      const data = {
        integration: 'incorrect-api-url',
        endpoint: 'nav',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(500)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
