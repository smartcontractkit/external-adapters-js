import { TestAdapter } from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'

// import { adapter } from '../../src/index'
import { TEST_BEARER_TOKEN, TEST_URL } from '../config'
import { mockHappyPathResponseSuccess } from '../fixtures'

describe('execute', () => {
  let testAdapter: TestAdapter

  beforeEach(async () => {
    process.env.BEARER_TOKEN = TEST_BEARER_TOKEN
    process.env.API_BASE_URL = TEST_URL

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterEach(async () => {
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
  })

  describe('nav endpoint', () => {
    it('should return success', async () => {
      const data = {
        artwork_id: 'banksy',
        endpoint: 'nav',
      }
      mockHappyPathResponseSuccess(data.artwork_id)
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
