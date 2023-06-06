import {
  mockResponseSuccessConversionEndpoint,
  mockResponseSuccessTickersEndpoint,
} from './fixtures'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'

describe('rest', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['API_KEY'] = process.env['API_KEY'] || 'fake-api-key'
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

  describe('forex api', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'conversion',
        base: 'USD',
        quote: 'GBP',
      }
      mockResponseSuccessConversionEndpoint()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('forex batch api', () => {
    const data1 = {
      endpoint: 'tickers',
      base: 'USD',
      quote: 'GBP',
    }

    const data2 = {
      endpoint: 'tickers',
      base: 'XAG',
      quote: 'CAD',
    }

    it('should return success', async () => {
      mockResponseSuccessTickersEndpoint()
      testAdapter.request(data1)
      testAdapter.request(data2)

      const response1 = await testAdapter.request(data1)
      expect(response1.statusCode).toBe(200)
      expect(response1.json()).toMatchSnapshot()

      const response2 = await testAdapter.request(data2)
      expect(response2.statusCode).toBe(200)
      expect(response2.json()).toMatchSnapshot()
    })
  })
})
