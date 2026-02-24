import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { mockResponseServerError, mockResponseSuccess } from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))

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
    // Clear the EA cache between tests
    const keys = testAdapter.mockCache?.cache.keys()
    if (keys) {
      for (const key of keys) {
        testAdapter.mockCache?.delete(key)
      }
    }
  })

  describe('nav endpoint', () => {
    // Test validation errors first (doesn't touch the cache for nav endpoint)
    describe('validation errors', () => {
      it('should return error for invalid endpoint', async () => {
        const response = await testAdapter.request({ endpoint: 'invalid' })
        expect(response.statusCode).toBe(404)
        expect(response.json()).toMatchSnapshot()
      })
    })

    // Test upstream failures before happy path to ensure clean cache
    describe('upstream failures', () => {
      it('should return error when upstream returns 5xx', async () => {
        const data = {
          endpoint: 'nav',
        }
        mockResponseServerError()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(504)
        expect(response.json()).toMatchSnapshot()
      })
    })

    // Test happy path last
    describe('happy path', () => {
      it('should return success', async () => {
        const data = {
          endpoint: 'nav',
        }
        mockResponseSuccess()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should use nav as default endpoint', async () => {
        mockResponseSuccess()
        const response = await testAdapter.request({})
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })
    })
  })
})
