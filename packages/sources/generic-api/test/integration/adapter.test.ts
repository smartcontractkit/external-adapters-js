import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockMultiHttpMissingPath,
  mockMultiHttpResponseSuccess,
  mockMultiHttpRipcordActivated,
  mockResponseSuccess,
} from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.TEST_API_URL = 'https://dataproviderapi.com/'
    process.env.TEST_AUTH_HEADER = 'X-API-Key'
    process.env.TEST_AUTH_HEADER_VALUE = 'myapikey'

    // Multi-http test env vars
    process.env.NX8_API_URL = 'https://multi-api.com/'
    process.env.NX8_AUTH_HEADER = 'Authorization'
    process.env.NX8_AUTH_HEADER_VALUE = 'Bearer test-token'
    process.env.RIPCORD_API_URL = 'https://ripcord-api.com/'
    process.env.MISSING_PATH_API_URL = 'https://missing-path-api.com/'

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

  describe('http endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'http',
        apiName: 'test',
        dataPath: 'PoR',
        ripcordPath: 'ripcord',
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
      expect(response.statusCode).toBe(200)
    })
  })

  describe('multi-http endpoint', () => {
    it('should return success with multiple values', async () => {
      const data = {
        endpoint: 'multi-http',
        apiName: 'NX8',
        dataPaths: [
          { name: 'nav', path: 'net_asset_value' },
          { name: 'aum', path: 'asset_under_management' },
        ],
        ripcordPath: 'ripcord',
        ripcordDisabledValue: 'false',
        providerIndicatedTimePath: 'updatedAt',
      }
      mockMultiHttpResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
      expect(response.statusCode).toBe(200)
    })

    it('should return error when ripcord is activated', async () => {
      const data = {
        endpoint: 'multi-http',
        apiName: 'RIPCORD',
        dataPaths: [{ name: 'nav', path: 'net_asset_value' }],
        ripcordPath: 'ripcord',
        ripcordDisabledValue: 'false',
      }
      mockMultiHttpRipcordActivated()
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
      expect(response.statusCode).toBe(503)
    })

    it('should return error when data path is not found', async () => {
      const data = {
        endpoint: 'multi-http',
        apiName: 'MISSING_PATH',
        dataPaths: [
          { name: 'nav', path: 'net_asset_value' },
          { name: 'aum', path: 'non_existent_field' },
        ],
      }
      mockMultiHttpMissingPath()
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
      expect(response.statusCode).toBe(500)
    })
  })
})
