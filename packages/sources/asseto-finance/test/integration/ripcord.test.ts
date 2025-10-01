import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockAuthResponseSuccess, mockReserveResponseRipcord } from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_ENDPOINT = 'https://open.syncnav.com/api'
    process.env.CLIENT_ID = process.env.CLIENT_ID ?? 'clientId'
    process.env.CLIENT_SECRET = process.env.CLIENT_SECRET ?? 'secret'
    process.env.GRANT_TYPE = process.env.GRANT_TYPE ?? 'grant-type'
    process.env.BACKGROUND_EXECUTE_MS = '0'

    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

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

  describe('reserve endpoint ripcord', () => {
    it('should return 502 when ripcord is true', async () => {
      const fundId = 8
      const data = {
        endpoint: 'reserve',
        fundId: fundId,
      }

      mockAuthResponseSuccess()
      mockReserveResponseRipcord(fundId)

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
