import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockResponseFailure,
  mockResponseSuccess,
  mockResponseSuccessWithMissingPrevSig,
} from './fixtures'

// Initialize logger factory before tests
beforeAll(() => {
  LoggerFactoryProvider.set()
})

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_KEY = 'fake-api-key'
    process.env.API_ENDPOINT = 'https://dataproviderapi.com'
    process.env.TEST_PUBKEYS = '97104f173d0e17ab8897f4cf92b6ca1a88faa20625d57653d6cd9196bcaa3109'

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

  describe('nav endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'nav',
        assetId: 'c52c3d79-8317-4692-86f8-4e0dfd508672',
        envVarPrefix: 'test',
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
    it('should return success with null prevSig', async () => {
      const data = {
        endpoint: 'nav',
        assetId: 'c52c3d79-8317-4692-86f8-4e0dfd508672',
        envVarPrefix: 'test',
      }
      mockResponseSuccessWithMissingPrevSig()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
    it('should return failure for invalid assetId', async () => {
      const data = {
        endpoint: 'nav',
        assetId: '35d707cc-1563-4420-b6fd-ecdd47cfa0d1',
        envVarPrefix: 'test',
      }
      mockResponseFailure()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
    it('should return 400 for invalid envVarPrefix', async () => {
      const data = {
        endpoint: 'nav',
        assetId: '35d707cc-1563-4420-b6fd-ecdd47cfa0d1',
        envVarPrefix: 'missing_prefix',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
