import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'

import { asset } from '../../src/endpoint/asset'
import { assets } from '../../src/endpoint/assets'
import {
  mockHappyPathResponseSuccessAsset,
  mockHappyPathResponseSuccessAssets,
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

    // Create adapter instance only once
    const adapter = (await import('../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterEach(async () => {
    setEnvVariables(oldEnv)
    nock.cleanAll()
    clearTestCache(testAdapter)
  })

  afterAll(async () => {
    spy.mockRestore()
    await testAdapter.api.close()
  })

  describe('endpoints', () => {
    describe('/assets', () => {
      it('should return success', async () => {
        const dataInput = {
          endpoint: assets.name,
        }

        mockHappyPathResponseSuccessAssets()
        const response = await testAdapter.request(dataInput)

        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })
    })

    describe('/asset/${asset_id}', () => {
      it('should return success for valid asset_id', async () => {
        const dataInput = {
          asset_id: TEST_SUCCESS_ASSET_ID,
          endpoint: asset.name,
        }

        mockHappyPathResponseSuccessAsset(dataInput.asset_id)
        const response = await testAdapter.request(dataInput)

        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should handle upstream bad response for asset_id', async () => {
        const data = {
          asset_id: TEST_FAILURE_ASSET_ID,
          endpoint: asset.name,
        }

        mockResponseFailureAsset(data.asset_id)

        const response = await testAdapter.request(data)
        expect(response.json()).toMatchSnapshot()
      })
    })
  })
})
