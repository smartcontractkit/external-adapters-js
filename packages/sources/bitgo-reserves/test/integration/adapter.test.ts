import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockResponseSuccess } from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.PROD_API_ENDPOINT = 'http://test-endpoint.com'
    process.env.PROD_PUBKEY = 'test'

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
        providerEndpoint: 'prod',
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
  // Note: issues with mock verifier prevent further tests
})
