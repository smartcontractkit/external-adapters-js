import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import {
  mockResponse401,
  mockResponse500,
  mockResponseEmptyData,
  mockResponseSuccess,
} from './fixtures'

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
        mockResponseSuccess()
        const response = await testAdapter.request({ endpoint: 'insurance_proof' })
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })
    })

    describe('validation errors', () => {
      it('should fail on invalid endpoint', async () => {
        const response = await testAdapter.request({ endpoint: 'invalid_endpoint' })
        expect(response.statusCode).toBe(404)
        expect(response.json()).toMatchSnapshot()
      })
    })

    describe('upstream failures', () => {
      it('should return 502 when provider returns empty data', async () => {
        nock.cleanAll()
        mockResponseEmptyData()
        const response = await testAdapter.request({ endpoint: 'insurance_proof' })
        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })

      it('should return 502 when provider returns 5xx error', async () => {
        nock.cleanAll()
        mockResponse500()
        const response = await testAdapter.request({ endpoint: 'insurance_proof' })
        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })

      it('should return 502 when provider returns 401 unauthorized', async () => {
        nock.cleanAll()
        mockResponse401()
        const response = await testAdapter.request({ endpoint: 'insurance_proof' })
        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })
    })
  })
})
