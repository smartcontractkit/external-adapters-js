import { mockForexResponse } from './fixtures'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'

describe('http', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['API_KEY'] = 'fake-api-key'
    // Setting WS_ENABLED=true will test that EA is still using 'rest' transport for forex due to logic in customRouter
    process.env['WS_ENABLED'] = 'true'
    const mockDate = new Date('2022-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
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

  describe('forex endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'forex',
        base: 'eth',
        quote: 'usd',
      }
      mockForexResponse()
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('live endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'live',
        base: 'aapl',
      }
      mockForexResponse()
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
    })

    it('override should return success', async () => {
      const data = {
        endpoint: 'live',
        base: 'WTI',
        quote: 'USD',
      }
      mockForexResponse()
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
