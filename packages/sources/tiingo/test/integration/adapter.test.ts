import { mockResponseSuccess } from './fixtures'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'

describe('execute http', () => {
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

  describe('cryptoyield endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'cryptoyield',
        aprTerm: '90Day',
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('crypto endpoint', () => {
    it('should return success', async () => {
      const data = {
        base: 'ETH',
        quote: 'USD',
        transport: 'rest',
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('eod endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'eod',
        ticker: 'USD',
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('top endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'top',
        base: 'ETH',
        quote: 'USD',
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('volume endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'volume',
        base: 'ETH',
        quote: 'USD',
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('vwap endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'vwap',
        base: 'ampl',
        quote: 'USD',
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('forex endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'forex',
        base: 'gbp',
        quote: 'usd',
        transport: 'rest',
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('iex endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'iex',
        ticker: 'aapl',
        transport: 'rest',
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('realized-vol endpoint', () => {
    it('should return success', async () => {
      const data = {
        base: 'ETH',
        endpoint: 'realized-vol',
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
