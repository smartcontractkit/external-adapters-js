import {
  mockCoinmetricsRealizedVolResponseSuccess,
  mockCoinmetricsResponseSuccess,
  mockCoinmetricsResponseSuccess2,
} from './fixtures'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'

describe('http', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['API_KEY'] = 'fake-api-key'
    const mockDate = new Date('2022-01-01T11:11:11.111Z')
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

  describe('price endpoint', () => {
    it('should return success', async () => {
      const data = {
        base: 'BTC',
        quote: 'USD',
        transport: 'rest',
      }
      mockCoinmetricsResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('burned endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'burned',
        asset: 'eth',
      }
      mockCoinmetricsResponseSuccess2()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('total-burned endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'total-burned',
        asset: 'eth',
      }
      mockCoinmetricsResponseSuccess2(10000)
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('realized-vol endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'realized-vol',
        from: 'eth',
        to: 'usd',
        resultPath: 'realVol7Day',
      }

      mockCoinmetricsRealizedVolResponseSuccess()
      const response = (await testAdapter.request(data)).json()

      expect(response.statusCode).toBe(200)
      expect(response.result).toEqual(response.data[data.resultPath])
      expect(response).toMatchSnapshot()
    })

    it('should return error if unsupported resultPath provided', async () => {
      const data = {
        endpoint: 'realized-vol',
        from: 'eth',
        to: 'usd',
        resultPath: 'INVALID_RESULT_PATH',
      }

      mockCoinmetricsRealizedVolResponseSuccess()
      const response = (await testAdapter.request(data)).json()

      expect(response.statusCode).toBe(400)
      expect(response).toMatchSnapshot()
    })
  })
})
