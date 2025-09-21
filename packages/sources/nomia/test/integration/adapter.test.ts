import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockResponseBEAError,
  mockResponseBlacklistedKey,
  mockResponseEmptyObject,
  mockResponseMalformedBEA,
  mockResponseNoData,
  mockResponseNonObject,
  mockResponseSuccess,
} from './fixtures'

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

  afterEach(() => {
    nock.cleanAll()
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
        query:
          'method=GetData&datasetname=NIPA&TableName=Table1&LineNumber=1&Frequency=Q&ResultFormat=JSON',
      }
      nock.cleanAll()
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should handle BEA API errors with enhanced logging', async () => {
      const data = {
        query:
          'method=GetData&datasetname=INVALID&TableName=Table1&LineNumber=1&Frequency=Q&ResultFormat=JSON',
      }
      nock.cleanAll()
      mockResponseBEAError()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json().errorMessage).toBe(
        'BEA API Error 40: The Dataset requested does not exist',
      )
    })

    it('should handle blacklisted API key with enhanced logging', async () => {
      const data = {
        query:
          'method=GetData&datasetname=NIPA&TableName=Table1&LineNumber=1&Frequency=Q&ResultFormat=JSON',
      }
      nock.cleanAll()
      mockResponseBlacklistedKey()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json().errorMessage).toContain('BEA API Error 0:')
      expect(response.json().errorMessage).toContain('UserID being used has been disabled')
    })

    it('should handle no data response', async () => {
      const data = {
        query:
          'method=GetData&datasetname=NIPA&TableName=Table1&LineNumber=1&Frequency=Q&ResultFormat=JSON',
      }
      nock.cleanAll()
      mockResponseNoData()
      const response = await testAdapter.request(data)
      // No data returns empty array, causing timeout (504)
      expect(response.statusCode).toBe(504)
    })

    it('should handle malformed BEA API response', async () => {
      const data = {
        query:
          'method=GetData&datasetname=NIPA&TableName=Table1&LineNumber=1&Frequency=Q&ResultFormat=JSON',
      }
      nock.cleanAll()
      mockResponseMalformedBEA()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json().errorMessage).toContain('Invalid response structure from BEA API')
    })

    it('should handle missing record for TableName/LineNumber', async () => {
      const data = {
        query:
          'method=GetData&datasetname=NIPA&TableName=NonExistentTable&LineNumber=999&Frequency=Q&ResultFormat=JSON',
      }
      nock.cleanAll()
      mockResponseSuccess() // Returns Table1 data, but we're asking for NonExistentTable
      const response = await testAdapter.request(data)
      // Missing record results in timeout (504) as no data is cached
      expect(response.statusCode).toBe(504)
    })

    it('should handle empty response object', async () => {
      const data = {
        query:
          'method=GetData&datasetname=NIPA&TableName=Table1&LineNumber=1&Frequency=Q&ResultFormat=JSON',
      }
      nock.cleanAll()
      mockResponseEmptyObject()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json().errorMessage).toContain('Empty response from BEA API')
    })

    it('should handle non-object response', async () => {
      const data = {
        query:
          'method=GetData&datasetname=NIPA&TableName=Table1&LineNumber=1&Frequency=Q&ResultFormat=JSON',
      }
      nock.cleanAll()
      mockResponseNonObject()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json().errorMessage).toContain('Invalid response structure from BEA API')
    })
  })
})
