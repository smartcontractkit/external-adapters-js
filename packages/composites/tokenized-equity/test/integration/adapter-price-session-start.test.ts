import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'

// End-to-end pre-open warm-up (session-start) gating of the price endpoint (DF-28181),
// enabled via DS_SESSION_START_GATING_ENABLED. Gating requires the session* request
// params (smoother 'none' forbids them), and fails closed (503) when the current
// session start cannot be determined — the EA relies on the tradinghours EA being up
// (no local schedule caching).

const NOW_MS = new Date('2001-01-01T11:11:11.111Z').getTime() // a Monday

const nsAtMs = (ms: number) => String(BigInt(ms) * 10n ** 6n)

// Trading-hours schedule: extended session (PRE_MARKET) opened at 09:00Z; the mocked
// clock is at 11:11Z.
const PRE_MARKET_OPEN_MS = new Date('2001-01-01T09:00:00.000Z').getTime()

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

const mockTradingHoursSchedule = (): nock.Scope =>
  nock('http://trading-hours', {
    encodedQueryParams: true,
  })
    .post('/')
    .reply(200, () => ({
      data: {
        result: [
          {
            status: 1,
            statusString: 'PRE_MARKET',
            time: '2001-01-01T09:00:00.000Z',
          },
          {
            status: 2,
            statusString: 'REGULAR',
            time: '2001-01-01T14:30:00.000Z',
          },
        ],
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

describe('price endpoint session-start gating (DF-28181)', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  const requestData = {
    asset: '0x0',
    extendedStreamId: '0x000b6',
    smoother: 'ema',
    sessionMarket: 'nyse',
    sessionMarketType: '24/5',
    sessionBoundariesTimeZone: 'UTC',
    decimals: 8,
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.DATA_ENGINE_ADAPTER_URL = 'http://data-engine'
    process.env.TRADING_HOURS_ADAPTER_URL = 'http://trading-hours'
    process.env.BACKGROUND_EXECUTE_MS = process.env.BACKGROUND_EXECUTE_MS ?? '1000'
    process.env.DS_SESSION_START_GATING_ENABLED = 'true'
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

  it('returns 200 when the report was produced after the current session start', async () => {
    mockDataEngine(nsAtMs(PRE_MARKET_OPEN_MS + 60_000))
    mockTradingHoursSchedule()

    const response = await testAdapter.request(requestData)

    expect(response.statusCode).toBe(200)
  })

  it('returns 503 when the report predates the current session start', async () => {
    // 30 minutes before the extended session opened: a leftover from the overnight session.
    mockDataEngine(nsAtMs(PRE_MARKET_OPEN_MS - 30 * 60_000))
    mockTradingHoursSchedule()

    // NB: distinct streamId per test — the response cache is keyed by params and would
    // otherwise serve a previous test's warmed response.
    const response = await testAdapter.request({
      ...requestData,
      extendedStreamId: '0x000b6-presession',
    })

    expect(response.statusCode).toBe(503)
    expect(JSON.stringify(response.json())).toMatch(/predates session start.*PRE_SESSION/)
  })

  it('fails closed (503) when the session schedule is unavailable', async () => {
    mockDataEngine(nsAtMs(PRE_MARKET_OPEN_MS + 60_000))
    mockTradingHoursResponseFailure()

    // NB: distinct streamId per test — the response cache is keyed by params and would
    // otherwise serve a previous test's warmed response.
    const response = await testAdapter.request({
      ...requestData,
      extendedStreamId: '0x000b6-schedule-down',
    })

    expect(response.statusCode).toBe(503)
    expect(JSON.stringify(response.json())).toMatch(/Session start unknown/)
  })
})
