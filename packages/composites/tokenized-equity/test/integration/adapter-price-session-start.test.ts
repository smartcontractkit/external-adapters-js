import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'

// End-to-end pre-open warm-up (session-start) gating of the price endpoint, enabled
// via SESSION_START_GATING_ENABLED. Gating identifies the market from the request's
// sessionMarket/sessionMarketType and falls back to the hard-coded labeled schedule
// (nyse/24/5) when tradinghours is unavailable or unusable — never to the smoother's
// sessionBoundaries. Requests without sessionMarket/sessionMarketType (the
// smoother:'none' feeds' steady state) skip the check entirely: pass-through, no fetch.

const NOW_MS = new Date('2001-01-01T11:11:11.111Z').getTime() // a Monday, 06:11 ET (EST)

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

// Schedule that answers successfully but has no transition opening PRE_MARKET —
// matrix row 7: the gate silently walks to the hard-coded fallback schedule.
const mockTradingHoursScheduleWithoutPreMarket = (): nock.Scope =>
  nock('http://trading-hours', {
    encodedQueryParams: true,
  })
    .post('/')
    .reply(200, () => ({
      data: {
        result: [
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

describe('price endpoint session-start gating', () => {
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
    process.env.SESSION_START_GATING_ENABLED = 'true'
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
    // Re-install benign persisted mocks after cleanup: subscriptions from earlier
    // tests stay warm (background execute keeps polling them), and without
    // interceptors their ENOTFOUND retries and backoff sleeps starve the shared
    // Requester queue, timing out later tests' requests. Each test cleans these
    // before installing its own.
    mockDataEngine(nsAtMs(PRE_MARKET_OPEN_MS + 60_000))
    mockTradingHoursSchedule()
  })

  beforeEach(() => {
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

  it('falls back to the hard-coded schedule when tradinghours is unavailable (in-session → 200)', async () => {
    // Hard-coded nyse/24/5 fallback: Monday PRE_MARKET opened 04:00 ET = 09:00Z.
    // Report produced at 09:01Z is in-session per the fallback.
    mockDataEngine(nsAtMs(PRE_MARKET_OPEN_MS + 60_000))
    mockTradingHoursResponseFailure()

    // NB: distinct streamId per test — the response cache is keyed by params and would
    // otherwise serve a previous test's warmed response.
    const response = await testAdapter.request({
      ...requestData,
      extendedStreamId: '0x000b6-schedule-down',
    })

    expect(response.statusCode).toBe(200)
  })

  it('surfaces gatingSessionSource=FALLBACK when a fetched schedule lacks a transition for the selected session', async () => {
    // Matrix row 7: tradinghours answers 200 but its schedule has no PRE_MARKET
    // transition. No fetch error is logged on this path, so the gate's fallback
    // activation must be visible in the response instead.
    mockDataEngine(nsAtMs(PRE_MARKET_OPEN_MS + 60_000))
    mockTradingHoursScheduleWithoutPreMarket()

    const response = await testAdapter.request({
      ...requestData,
      extendedStreamId: '0x000b6-schedule-missing-transition',
    })

    // The fallback's Monday PRE_MARKET open (04:00 ET = 09:00Z) matches the report
    // (09:01Z), so the request passes — with the gate's source marked FALLBACK.
    expect(response.statusCode).toBe(200)
    expect(JSON.stringify(response.json())).toContain('"gatingSessionSource":"FALLBACK"')
  })

  it('rejects pre-session reports against the hard-coded fallback when tradinghours is unavailable', async () => {
    // 08:30Z is before the fallback PRE_MARKET open (04:00 ET = 09:00Z): an overnight
    // leftover, gated even with tradinghours down.
    mockDataEngine(nsAtMs(PRE_MARKET_OPEN_MS - 30 * 60_000))
    mockTradingHoursResponseFailure()

    const response = await testAdapter.request({
      ...requestData,
      extendedStreamId: '0x000b6-schedule-down-presession',
    })

    expect(response.statusCode).toBe(503)
    expect(JSON.stringify(response.json())).toMatch(/predates session start.*PRE_SESSION/)
  })

  it("gates a smoother 'none' feed that carries sessionMarket/sessionMarketType", async () => {
    // Validation relaxation: sessionMarket/sessionMarketType are allowed with
    // smoother 'none' (they have a non-smoother consumer now). No timezone or
    // boundaries params needed — gating's timezone comes from the hard-coded map
    // entry. In-session → 200.
    mockDataEngine(nsAtMs(PRE_MARKET_OPEN_MS + 60_000))
    mockTradingHoursSchedule()

    const response = await testAdapter.request({
      asset: '0x0',
      extendedStreamId: '0x000b6-none-feed',
      smoother: 'none',
      sessionMarket: 'nyse',
      sessionMarketType: '24/5',
      decimals: 8,
    })

    expect(response.statusCode).toBe(200)
  })

  it("skips session-start gating for a smoother 'none' feed with no market identity", async () => {
    // No sessionMarket/sessionMarketType → no market identity to gate against, so the
    // check is a pass-through even with the flag on (and no tradinghours fetch — pinned
    // at the unit level). The tradinghours mock is for earlier tests' still-warm gated
    // subscriptions, whose background polls would otherwise stall the shared requester
    // on ENOTFOUND retries.
    mockDataEngine(nsAtMs(PRE_MARKET_OPEN_MS + 60_000))
    mockTradingHoursSchedule()

    const response = await testAdapter.request({
      asset: '0x0',
      extendedStreamId: '0x000b6-none-no-market',
      smoother: 'none',
      decimals: 8,
    })

    expect(response.statusCode).toBe(200)
  })

  it("serves a pre-session report for a smoother 'none' feed with no market identity", async () => {
    // Same skip, now with a report that WOULD be rejected if gating applied: 30 minutes
    // before the extended session opened. The skip means even a pre-open leftover
    // passes through — the accepted coverage gap for feeds without market identity.
    mockDataEngine(nsAtMs(PRE_MARKET_OPEN_MS - 30 * 60_000))
    mockTradingHoursSchedule() // for earlier tests' still-warm gated subscriptions

    const response = await testAdapter.request({
      asset: '0x0',
      extendedStreamId: '0x000b6-none-no-market-presession',
      smoother: 'none',
      decimals: 8,
    })

    expect(response.statusCode).toBe(200)
  })

  it('marketSessionOverride forces the pre-session rejection for a fresh in-session report', async () => {
    // Deterministic demo of the warm-up filter: the report is fresh and in-session
    // (PRE_MARKET opened 09:00Z, report from 09:01Z), but the override gates against
    // the NEXT REGULAR open (14:30Z per the mocked schedule) — after the report — so
    // the check rejects exactly as if the data-engine had returned a pre-open leftover.
    mockDataEngine(nsAtMs(PRE_MARKET_OPEN_MS + 60_000))
    mockTradingHoursSchedule()

    const response = await testAdapter.request({
      ...requestData,
      extendedStreamId: '0x000b6-override-regular',
      marketSessionOverride: 'REGULAR',
    })

    expect(response.statusCode).toBe(503)
    expect(JSON.stringify(response.json())).toMatch(
      /predates session start.*PRE_SESSION.*\[marketSessionOverride=REGULAR\]/,
    )
  })

  it('marketSessionOverride fails closed when the schedule has no future start for the overridden session', async () => {
    // The mocked schedule's only PRE_MARKET transition (09:00Z) is in the past; the
    // override resolves the NEXT PRE_MARKET start, tradinghours only (never the
    // hard-coded fallback) — none exists, so 503 with the forced marker.
    mockDataEngine(nsAtMs(PRE_MARKET_OPEN_MS + 60_000))
    mockTradingHoursSchedule()

    const response = await testAdapter.request({
      ...requestData,
      extendedStreamId: '0x000b6-override-premarket',
      marketSessionOverride: 'PRE_MARKET',
    })

    expect(response.statusCode).toBe(503)
    expect(JSON.stringify(response.json())).toMatch(
      /Session start unknown.*\[marketSessionOverride=PRE_MARKET\]/,
    )
  })

  it('rejects with 400 when marketSessionOverride is passed without market identity', async () => {
    mockDataEngine(nsAtMs(PRE_MARKET_OPEN_MS + 60_000))
    mockTradingHoursSchedule() // for earlier tests' still-warm gated subscriptions

    const response = await testAdapter.request({
      asset: '0x0',
      extendedStreamId: '0x000b6-override-no-market',
      smoother: 'none',
      decimals: 8,
      marketSessionOverride: 'REGULAR',
    })

    expect(response.statusCode).toBe(400)
    expect(JSON.stringify(response.json())).toMatch(
      /marketSessionOverride requires sessionMarket and sessionMarketType/,
    )
  })
})
