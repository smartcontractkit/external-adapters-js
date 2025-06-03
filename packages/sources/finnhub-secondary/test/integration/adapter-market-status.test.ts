import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import process from 'process'

import { mockMarketStatusResponseSuccess } from './fixtures'

describe('Market status endpoint', () => {
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

  const openMarket = {
    endpoint: 'market-status',
    market: 'NYSE',
  }
  const closedMarket = {
    endpoint: 'market-status',
    market: 'AD',
  }
  const nullMarket = {
    endpoint: 'market-status',
    market: 'AS',
  }
  const unknownMarket = {
    endpoint: 'market-status',
    market: 'AT',
  }
  const invalidMarket = {
    endpoint: 'market-status',
    market: 'invalid_market',
  }
  const lowerCaseMarket = {
    endpoint: 'market-status',
    market: 'nyse',
  }

  it('should return success with open', async () => {
    mockMarketStatusResponseSuccess()

    const response = await testAdapter.request(openMarket)
    expect(response.json()).toMatchSnapshot()
    expect(response.json().result).toEqual(MarketStatus.OPEN)
  })

  it('should return success with closed', async () => {
    mockMarketStatusResponseSuccess()

    const response = await testAdapter.request(closedMarket)
    expect(response.json()).toMatchSnapshot()
    expect(response.json().result).toEqual(MarketStatus.CLOSED)
  })

  it('should return success with closed; null status in response', async () => {
    mockMarketStatusResponseSuccess()

    const response = await testAdapter.request(nullMarket)
    expect(response.json()).toMatchSnapshot()
    expect(response.json().result).toEqual(MarketStatus.CLOSED)
  })

  it('should return success with unknown', async () => {
    mockMarketStatusResponseSuccess()

    const response = await testAdapter.request(unknownMarket)
    expect(response.json()).toMatchSnapshot()
    expect(response.json().result).toEqual(MarketStatus.UNKNOWN)
  })

  it('should return error for invalid market', async () => {
    mockMarketStatusResponseSuccess()

    const response = await testAdapter.request(invalidMarket)
    expect(response.json()).toMatchSnapshot()
    expect(response.statusCode).toBe(400)
  })

  it('should return success with lower case market', async () => {
    mockMarketStatusResponseSuccess()

    const response = await testAdapter.request(lowerCaseMarket)
    expect(response.json()).toMatchSnapshot()
    expect(response.json().result).toEqual(MarketStatus.OPEN)
  })
})
