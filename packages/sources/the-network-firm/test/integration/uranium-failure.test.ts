import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockUraniumResponseFailure } from './fixtures'

// The uranium endpoint has no input parameters, so its success and failure cases
// resolve to the same cache key. Keeping the failure case in its own file gives it a
// dedicated TestAdapter with a fresh cache and no preceding uranium success request,
// which prevents a stale success value from bleeding in via the background executor.
describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    process.env.ALT_API_ENDPOINT = 'http://test-endpoint-new'
    process.env.URANIUM_API_KEY = 'api-key'

    const adapter = (await import('../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
    testAdapter.adapter.config.settings.METRICS_ENABLED = false
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  describe('uranium endpoint', () => {
    it('should fail', async () => {
      const data = {
        endpoint: 'uranium',
      }
      mockUraniumResponseFailure()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
