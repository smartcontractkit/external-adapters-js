import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'

// PR1 checkpoint 1 (DF-28181): end-to-end staleness behavior of the price endpoint.
// DS_VALID_MAX_AGE_SECONDS is not part of the adapter config yet — the "rejects" tests fail
// (the adapter ignores the env var and returns 200) until checkpoint 2.

const NOW_MS = new Date('2001-01-01T11:11:11.111Z').getTime()

const nsAtAge = (ageSeconds: number) =>
  String(BigInt(Math.round(NOW_MS - ageSeconds * 1000)) * 10n ** 6n)

const mockDataEngine = (lastSeenTimestampNs: string): nock.Scope =>
  nock('http://data-engine', {
    encodedQueryParams: true,
  })
    .post('/')
    .reply(200, () => ({
      data: {
        mid: '1',
        lastSeenTimestampNs,
        bid: '3',
        bidVolume: 4,
        ask: '5',
        askVolume: 6,
        lastTradedPrice: '7',
        marketStatus: 1, // PRE_MARKET → extended stream selected
        decimals: 1,
      },
      statusCode: 200,
    }))
    .persist()

const mockTradingHoursResponseFailure = (): nock.Scope =>
  nock('http://trading-hours', {
    encodedQueryParams: true,
  })
    .post('/')
    .reply(200, () => ({ statusCode: 500 }))
    .persist()

describe('price endpoint staleness (DF-28181)', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  const requestData = {
    asset: '0x0',
    extendedStreamId: '0x000b6',
    smoother: 'none',
    decimals: 8,
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.DATA_ENGINE_ADAPTER_URL = 'http://data-engine'
    process.env.TRADING_HOURS_ADAPTER_URL = 'http://trading-hours'
    process.env.BACKGROUND_EXECUTE_MS = process.env.BACKGROUND_EXECUTE_MS ?? '1000'
    process.env.DS_VALID_MAX_AGE_SECONDS = '30'
    spy = jest.spyOn(Date, 'now').mockReturnValue(NOW_MS)

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

  afterEach(() => {
    nock.cleanAll()
  })

  it('returns 200 when the active stream report is fresh', async () => {
    mockDataEngine(nsAtAge(5))
    mockTradingHoursResponseFailure()

    const response = await testAdapter.request(requestData)

    expect(response.statusCode).toBe(200)
  })

  it('returns 503 when the active stream report is older than DS_VALID_MAX_AGE_SECONDS', async () => {
    mockDataEngine(nsAtAge(4000))
    mockTradingHoursResponseFailure()

    const response = await testAdapter.request(requestData)

    expect(response.statusCode).toBe(503)
    expect(response.json().error).toEqual(expect.stringMatching(/extended STALE/))
  })
})
