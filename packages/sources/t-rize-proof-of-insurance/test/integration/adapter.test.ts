import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import {
  mockResponseNoData,
  mockResponseServerError,
  mockResponseSuccess,
  mockResponseUnauthorized,
} from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.TRIZE_API_TOKEN = process.env.TRIZE_API_TOKEN ?? 'fake-api-token'

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
    // Clear the cache between tests to prevent test pollution
    const keys = testAdapter.mockCache?.cache.keys()
    if (keys) {
      for (const key of keys) {
        testAdapter.mockCache?.delete(key)
      }
    }
  })

  describe('insurance_proof endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'insurance_proof',
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success with empty request body (uses default endpoint)', async () => {
      mockResponseSuccess()
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('upstream failures', () => {
    it('should return 502 when provider returns no data', async () => {
      mockResponseNoData()
      const response = await testAdapter.request({
        endpoint: 'insurance_proof',
      })
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error on 401 unauthorized', async () => {
      mockResponseUnauthorized()
      const response = await testAdapter.request({
        endpoint: 'insurance_proof',
      })
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error on 500 server error', async () => {
      mockResponseServerError()
      const response = await testAdapter.request({
        endpoint: 'insurance_proof',
      })
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
