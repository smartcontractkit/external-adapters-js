import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockResponseBEAError, mockResponseSuccess } from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_KEY = process.env.API_KEY ?? 'fake-api-key'
    process.env.API_ENDPOINT = process.env.API_ENDPOINT ?? 'https://dataproviderapi.com'

    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  beforeEach(() => {
    // Ensure clean state before each test
    nock.cleanAll()
    nock.abortPendingRequests()
  })

  afterEach(() => {
    // Clean up after each test to ensure isolation
    nock.cleanAll()
    nock.abortPendingRequests()
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  describe('price endpoint', () => {
    it('should return success', async () => {
      const data = {
        query: 'TableName=Table1&LineNumber=1',
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should handle BEA API errors', async () => {
      const data = {
        query: 'TableName=Table2&LineNumber=2', // Different params to avoid cache hit
      }
      mockResponseBEAError()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json().errorMessage).toBe(
        'BEA API Error 40: The Dataset requested does not exist',
      )
    })
  })
})
