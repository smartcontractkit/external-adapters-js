import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockStagingResponseSuccess,
  mockTestResponseRipcord,
  mockTestResponseStringRipcord,
  mockTestResponseSuccess,
  mockTestResponseSuccessStringFalse,
} from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.STAGING_API_ENDPOINT = 'http://staging-endpoint.com'
    process.env.STAGING_PUBKEY = 'test'
    process.env.TEST_API_ENDPOINT = 'http://test-endpoint.com'
    process.env.TEST_PUBKEY = 'test'

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

  describe('reserves-staging endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'reserves-staging',
      }
      mockStagingResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
  describe('reserves-test endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'reserves-test',
      }
      mockTestResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
    it('should return success - string ripcord', async () => {
      const data = {
        endpoint: 'reserves-test',
      }
      mockTestResponseSuccessStringFalse()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
    it('should return ripcord', async () => {
      const data = {
        endpoint: 'reserves-test',
      }
      mockTestResponseRipcord()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
    it('should return ripcord - string', async () => {
      const data = {
        endpoint: 'reserves-test',
      }
      mockTestResponseStringRipcord()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })
  // Note: issues with mock verifier prevent further tests
})
