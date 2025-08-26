import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockResponseFailure, mockResponseSuccess } from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.PASSWORD_ABC123 = 'fake-api-key'
    process.env.API_ENDPOINT = 'https://dataproviderapi.com'

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
        clientId: 'abc123',
        isin: 'A0B1C2D3',
        endpoint: 'nav',
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
    it('missing client ID password should fail 500', async () => {
      const data = {
        clientId: 'BAD_CLIENT_ID',
        isin: 'A0B1C2D3',
        endpoint: 'nav',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
    })
    it('bad ISIN should fail', async () => {
      const data = {
        clientId: 'abc123',
        isin: 'BAD_ISIN',
        endpoint: 'nav',
      }
      mockResponseFailure()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
    })
  })
})
