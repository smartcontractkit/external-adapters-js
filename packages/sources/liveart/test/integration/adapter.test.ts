import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'

import {
  mockHappyPathResponseSuccessAsset,
  mockResponseApiFailureAsset,
  mockResponseFailureAsset,
} from './utils/fixtures'
import { TEST_FAILURE_ASSET_ID, TEST_SUCCESS_ASSET_ID, TEST_URL } from './utils/testConfig'
import { clearTestCache } from './utils/utilFunctions'

describe('LiveArt NAV', () => {
  let testAdapter: TestAdapter
  let spy: jest.SpyInstance
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    // Mock time for request's timestamp
    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())
    // Set environment variables
    process.env.API_BASE_URL = TEST_URL
    process.env.BACKGROUND_EXECUTE_MS = '0'

    // Create adapter instance only once
    const adapter = (await import('../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    clearTestCache(testAdapter)
    await testAdapter.api.close()
    spy.mockRestore()
    setEnvVariables(oldEnv)
    nock.restore()
    nock.cleanAll()
  })

  describe('endpoints', () => {
    describe('nav', () => {
      it('should return success for valid assetId', async () => {
        const dataInput = {
          assetId: TEST_SUCCESS_ASSET_ID,
          endpoint: 'nav',
        }

        mockHappyPathResponseSuccessAsset(dataInput.assetId)
        const response = await testAdapter.request(dataInput)

        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should return error for invalid assetId', async () => {
        const data = {
          assetId: 'invalid-asset-id',
          endpoint: 'nav',
        }

        // Mock for other assetId
        mockHappyPathResponseSuccessAsset(data.assetId)

        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })

      it('should handle upstream bad response for unsuccessful request', async () => {
        const data = {
          assetId: TEST_FAILURE_ASSET_ID,
          endpoint: 'nav',
        }

        mockResponseFailureAsset(data.assetId)

        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })

      it('framework should handle API 422 bad response', async () => {
        const data = {
          assetId: 'abcd',
          endpoint: 'nav',
        }

        // prep cache
        await testAdapter.request(data)

        mockResponseApiFailureAsset()

        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })
    })
  })
})
