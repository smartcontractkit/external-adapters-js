import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockResponseRipcord,
  mockResponseStringRipcord,
  mockResponseSuccess,
  mockResponseSuccessC1,
  mockResponseSuccessStringFalse,
} from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_ENDPOINT = 'http://test-endpoint.com'
    process.env.VERIFICATION_PUBKEY = 'test'

    process.env.C1_API_ENDPOINT = 'http://test-endpoint-c1.com'
    process.env.C1_VERIFICATION_PUBKEY = 'test-c1'

    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    jest.mock('crypto', () => ({
      createVerify: jest.fn().mockImplementation((_algo) => ({
        update: jest.fn().mockReturnThis(),
        verify: jest.fn().mockImplementationOnce((a, b, c) => true),
      })),
    }))
    const adapter = (await import('../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterEach(() => {
    nock.cleanAll()
    testAdapter.mockCache?.cache.clear()
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  describe('reserves endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'reserves',
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success for multi client', async () => {
      const data = {
        endpoint: 'reserves',
        client: 'c1',
      }
      mockResponseSuccessC1()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return failure for non exist client', async () => {
      const data = {
        endpoint: 'reserves',
        client: 'c2',
      }
      mockResponseSuccess()
      mockResponseSuccessC1()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success - string ripcord', async () => {
      const data = {
        endpoint: 'reserves',
      }
      mockResponseSuccessStringFalse()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return fail - ripcord', async () => {
      const data = {
        endpoint: 'reserves',
      }
      mockResponseRipcord()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return fail - string ripcord', async () => {
      const data = {
        endpoint: 'reserves',
      }
      mockResponseStringRipcord()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })
  // Note: issues with mock verifier prevent further tests
})
