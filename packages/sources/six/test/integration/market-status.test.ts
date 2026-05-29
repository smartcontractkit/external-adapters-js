import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockFourMarkets,
  mockOneMarket,
  mockThreeMarkets,
  mockTwoMarkets,
} from './market-status-fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.PRIVATE_KEY =
      '-----BEGIN PRIVATE KEY-----\nfake-private-key\n-----END PRIVATE KEY-----'
    process.env.PUBLIC_CERT =
      '-----BEGIN CERTIFICATE-----\nfake-public-cert\n-----END CERTIFICATE-----'
    // By-pass any HTTP(S)_PROXY/ALL_PROXY set locally
    process.env.no_proxy = '*'

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

  describe('market-status endpoint', () => {
    it('should return success with open market', async () => {
      mockOneMarket()
      const response = await testAdapter.request({
        endpoint: 'market-status',
        market: 'six',
      })
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toEqual(MarketStatus.OPEN)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success with closed market', async () => {
      mockTwoMarkets()
      const response = await testAdapter.request({
        endpoint: 'market-status',
        market: '2',
      })
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toEqual(MarketStatus.CLOSED)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return unknown for REFERENCE_ONLY market status', async () => {
      mockThreeMarkets()
      const response = await testAdapter.request({
        endpoint: 'market-status',
        market: '3',
      })
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toEqual(MarketStatus.UNKNOWN)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return unknown when market is not in response', async () => {
      mockFourMarkets()
      const response = await testAdapter.request({
        endpoint: 'market-status',
        market: '5',
      })
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toEqual(MarketStatus.UNKNOWN)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
