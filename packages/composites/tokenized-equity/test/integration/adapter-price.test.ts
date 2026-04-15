import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockResponseSuccess, mockTradingHoursResponseFailure } from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.DATA_ENGINE_ADAPTER_URL = 'http://data-engine'
    process.env.TRADING_HOURS_ADAPTER_URL = 'http://trading-hours'
    process.env.BACKGROUND_EXECUTE_MS = process.env.BACKGROUND_EXECUTE_MS ?? '1000'
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

  describe('price endpoint', () => {
    it('should return success - kalman', async () => {
      const data = {
        asset: '0x0',
        regularStreamId: '0x000b5',
        extendedStreamId: '0x000b6',
        overnightStreamId: '0x000b7',
        sessionMarket: 'nyse',
        sessionMarketType: '24/5',
        sessionBoundaries: [],
        sessionBoundariesTimeZone: 'UTC',
        decimals: 8,
      }
      mockResponseSuccess()
      mockTradingHoursResponseFailure()

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success - ema', async () => {
      const data = {
        asset: '0x0',
        regularStreamId: '0x000b5',
        extendedStreamId: '0x000b6',
        overnightStreamId: '0x000b7',
        sessionMarket: 'nyse',
        sessionMarketType: '24/5',
        sessionBoundaries: [],
        sessionBoundariesTimeZone: 'UTC',
        smoother: 'ema',
        decimals: 8,
      }
      mockResponseSuccess()
      mockTradingHoursResponseFailure()

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('bad sessionBoundariesTimeZone', async () => {
      const data = {
        asset: '0x0',
        regularStreamId: '0x000b5',
        extendedStreamId: '0x000b5',
        overnightStreamId: '0x000b5',
        sessionMarket: 'nyse',
        sessionMarketType: '24/5',
        sessionBoundaries: ['00:00'],
        sessionBoundariesTimeZone: 'random',
        decimals: 8,
      }

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })

    it('bad sessionBoundaries', async () => {
      const data = {
        asset: '0x0',
        regularStreamId: '0x000b5',
        extendedStreamId: '0x000b5',
        overnightStreamId: '0x000b5',
        sessionMarket: 'nyse',
        sessionMarketType: '24/5',
        sessionBoundaries: ['99:88'],
        sessionBoundariesTimeZone: 'UTC',
        decimals: 8,
      }

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
