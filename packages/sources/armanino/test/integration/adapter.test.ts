import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockMCO2Response,
  mockSTBTResponseFailure,
  mockSTBTResponseSuccessInterceptor,
} from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    process.env['RATE_LIMIT_CAPACITY_SECOND'] = '1000'
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter
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

  describe('mco2 endpoint', () => {
    it('should return success', async () => {
      mockMCO2Response()
      const response = await testAdapter.request()
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('stbt endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'stbt',
      }
      const interceptor = mockSTBTResponseSuccessInterceptor()
      interceptor
        .reply(200, {
          accountName: 'STBT',
          totalReserve: 72178807.56,
          totalToken: 71932154.99,
          timestamp: '2023-06-02T12:53:23.604Z',
        })
        .persist()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
      nock.removeInterceptor(interceptor)
    })

    it('should return error when ripcord true', async () => {
      // We change the CACHE_PREFIX otherwise the test will immediately receive an already cached response from previous test
      testAdapter.adapter.config.settings.CACHE_PREFIX = 'stbt_failure'
      const data = {
        endpoint: 'stbt',
      }
      mockSTBTResponseFailure()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
