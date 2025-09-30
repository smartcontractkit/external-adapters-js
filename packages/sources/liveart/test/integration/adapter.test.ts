import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'

import { TEST_BEARER_TOKEN, TEST_URL } from '../utils/testConfig'
import { clearTestCache } from '../utils/utilFunctions'
import { mockHappyPathResponseSuccess, mockResponseFailure } from './utils/fixtures'

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
    process.env.BEARER_TOKEN = TEST_BEARER_TOKEN
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

  describe('endpoint', () => {
    it('should return success for both valid artwork_id and artworkId', async () => {
      const dataInput = {
        artwork_id: 'banksy',
        endpoint: 'nav',
      }

      const expectedValueString = '1000000'
      mockHappyPathResponseSuccess(dataInput.artwork_id, expectedValueString)
      const response1 = await testAdapter.request(dataInput)

      expect(response1.statusCode).toBe(200)
      expect(response1.json()).toMatchSnapshot()
    })

    it('should return success for valid artworkId', async () => {
      const dataInput = {
        artworkId: 'banksy',
        endpoint: 'nav',
      }

      const expectedValueString = '1000000'
      mockHappyPathResponseSuccess(dataInput.artworkId, expectedValueString)
      const response2 = await testAdapter.request(dataInput)

      expect(response2.statusCode).toBe(200)
      expect(response2.json()).toMatchSnapshot()
    })

    it('should handle upstream bad response', async () => {
      const data = {
        artwork_id: 'dicaprio',
        endpoint: 'nav',
      }

      mockResponseFailure(data.artwork_id)

      const response = await testAdapter.request(data)
      const responseJson = response.json()

      expect(responseJson.data).toBeUndefined()
      expect(responseJson.result).toBeUndefined()
      expect(response.statusCode).toBe(502)
      expect(responseJson.errorMessage).toBe(
        `The data provider failed to return a value for artwork_id=${data.artwork_id}, errorMessage: Asset ID '${data.artwork_id}' not found`,
      )
      expect(response.json()).toMatchSnapshot()
    })
  })
})
