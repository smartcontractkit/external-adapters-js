import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { mockResponseEmptyData, mockResponseServerError, mockResponseSuccess } from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.TRIZE_API_TOKEN = process.env.TRIZE_API_TOKEN ?? 'fake-api-token'
    process.env.BACKGROUND_EXECUTE_MS = '0'
    process.env.RETRY = '0'

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
    // Clear the EA cache between tests to ensure each test starts fresh
    const keys = testAdapter.mockCache?.cache.keys()
    if (keys) {
      for (const key of keys) {
        testAdapter.mockCache?.delete(key)
      }
    }
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  describe('insurance_proof endpoint', () => {
    describe('happy path', () => {
      it('should return success', async () => {
        const data = {
          endpoint: 'insurance_proof',
        }
        mockResponseSuccess()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should work with default endpoint', async () => {
        mockResponseSuccess()
        const response = await testAdapter.request({})
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })
    })

    describe('validation errors', () => {
      it('should fail on invalid endpoint', async () => {
        const data = {
          endpoint: 'invalid_endpoint',
        }
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(404)
        expect(response.json()).toMatchSnapshot()
      })
    })

    describe('upstream failures', () => {
      it('should return 502 when data provider returns empty data', async () => {
        mockResponseEmptyData()
        const response = await testAdapter.request({
          endpoint: 'insurance_proof',
        })
        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })

      it('should handle upstream 5xx errors', async () => {
        mockResponseServerError()
        const response = await testAdapter.request({
          endpoint: 'insurance_proof',
        })
        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })
    })
  })
})
