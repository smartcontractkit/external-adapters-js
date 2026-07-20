import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { mockCircleResponseSuccess } from './fixtures-api'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.RPC_URL = process.env.RPC_URL ?? 'http://localhost:8080'
    process.env.CIRCLE_API_URL = 'http://circle.api'
    process.env.BACKGROUND_EXECUTE_MS = '0'

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

  describe('circle', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'circle',
      }

      mockCircleResponseSuccess()

      const response = await testAdapter.request(data)

      expect(response.json()).toMatchSnapshot()
      expect(response.statusCode).toBe(200)
    })
  })
})
