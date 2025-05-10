import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import process from 'process'

import {
  mockMarketStatusResponseSuccessClosed,
  mockMarketStatusResponseSuccessNull,
  mockMarketStatusResponseSuccessOpen,
} from './fixtures'

describe('Market status endpoint', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv
  const cacheKey = 'FINNHUB-market-status-default_single_transport-{"market":"nyse"}'

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

  beforeEach(() => {
    testAdapter.mockCache.delete(cacheKey)
    nock.cleanAll()
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  const validData = {
    endpoint: 'market-status',
    market: 'NYSE',
  }
  const invalidMarket = {
    endpoint: 'market-status',
    market: 'FFF',
  }

  it('should return success with open', async () => {
    mockMarketStatusResponseSuccessOpen()

    const response = await testAdapter.request(validData)
    expect(response.json()).toMatchSnapshot()
    expect(response.json().result).toEqual(MarketStatus.OPEN)
  })

  it('should return success with closed', async () => {
    mockMarketStatusResponseSuccessClosed()

    const response = await testAdapter.request(validData)
    expect(response.json()).toMatchSnapshot()
    expect(response.json().result).toEqual(MarketStatus.CLOSED)
  })

  it('should return success with closed; null status in response', async () => {
    mockMarketStatusResponseSuccessNull()

    const response = await testAdapter.request(validData)
    expect(response.json()).toMatchSnapshot()
    expect(response.json().result).toEqual(MarketStatus.CLOSED)
  })

  it('should return error for invalid market', async () => {
    mockMarketStatusResponseSuccessOpen()

    const response = await testAdapter.request(invalidMarket)
    expect(response.json()).toMatchSnapshot()
    expect(response.statusCode).toBe(400)
  })
})
