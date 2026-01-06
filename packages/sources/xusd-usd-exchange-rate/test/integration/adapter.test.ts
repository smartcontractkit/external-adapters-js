import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockResponseNoResult,
  mockResponseRpcError,
  mockResponseServerError,
  mockResponseSuccess,
  mockRpcUrl,
} from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    process.env.ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL ?? mockRpcUrl
    process.env.BACKGROUND_EXECUTE_MS = '10000'

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

  beforeEach(() => {
    nock.cleanAll()
    if (testAdapter.mockCache?.cache) {
      testAdapter.mockCache.cache.clear()
    }
  })

  describe('round endpoint', () => {
    describe('happy path', () => {
      it('should return success', async () => {
        const data = {
          endpoint: 'round',
        }
        mockResponseSuccess()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should return success with empty request body (default endpoint)', async () => {
        mockResponseSuccess()
        const response = await testAdapter.request({})
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })
    })

    describe('upstream failures', () => {
      it('should handle RPC error response', async () => {
        const data = {
          endpoint: 'round',
        }
        mockResponseRpcError()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })

      it('should handle response with no result', async () => {
        const data = {
          endpoint: 'round',
        }
        mockResponseNoResult()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })

      it('should handle server error (5xx)', async () => {
        const data = {
          endpoint: 'round',
        }
        mockResponseServerError()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })
    })

    describe('validation errors', () => {
      it('should return error for invalid endpoint', async () => {
        const data = {
          endpoint: 'invalid-endpoint',
        }
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(404)
        expect(response.json()).toMatchSnapshot()
      })
    })
  })
})
