import { mockCryptoSuccess, mockVwapSuccess } from './fixtures'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['API_KEY'] = 'API_KEY'
    process.env['WS_ENABLED'] = 'false'
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

  describe('crypto api', () => {
    it('should return success', async () => {
      const data = {
        base: 'ETH',
        quote: 'USD',
      }
      mockCryptoSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return failure for array', async () => {
      const data = {
        base: ['ETH', 'BTC'],
        quote: 'USD',
      }
      mockCryptoSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('volume api', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'volume',
        base: 'ETH',
        quote: 'USD',
      }
      mockCryptoSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('marketcap api', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'marketcap',
        base: 'ETH',
        quote: 'USD',
      }
      mockCryptoSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('vwap api', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'vwap',
        base: 'AMPL',
        quote: 'USD',
      }
      mockVwapSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
