import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'

// Integration tests for 24/7 session-start gating on issuer-price-247 (TDD:
// docs/issuer-247-session-start-gating-tdd.md) with the flag ON and the
// fail-on-indeterminate-session flag at its default (true). The flag-off
// no-regression case is covered by adapter-issuerPrice247.test.ts (flags unset).
//
// Fixed "now": Saturday 2024-01-06 10:00 ET (15:00 UTC). The weekend closed span
// opened at Friday 20:00 ET (2024-01-06T01:00Z) — the end of Friday's post-market
// phase.

const feedId = '0x000b0b1c31f90396e910c57ec94ed963271e4e39f15da3d92f81e273083ce4a1'

// The transport's response cache keys on request params, so each test that mutates
// the mocked report needs its own feedId to avoid a cached response from an earlier
// test.
let feedCounter = 0
const freshFeedId = () => `${feedId.slice(0, -2)}${String(feedCounter++).padStart(2, '0')}`
const NOW = new Date('2024-01-06T15:00:00.000Z').getTime() // Sat 10:00 ET

const ns = (iso: string): string => (BigInt(new Date(iso).getTime()) * 10n ** 6n).toString()

// Mutable so each test sets the report's session/timestamp.
let reportMarketStatus = 5 // WEEKEND
let reportLastSeen = ns('2024-01-06T14:00:00.000Z') // Sat 09:00 ET — in-session

const mockDataEngine = (): nock.Scope =>
  nock('http://data-engine', { encodedQueryParams: true })
    .post('/', (body) => body?.data?.endpoint === 'deutscheBoerse-v11')
    .reply(200, () => ({
      result: null,
      data: {
        mid: '250000000000000000000',
        lastSeenTimestampNs: reportLastSeen,
        bid: '249900000000000000000',
        bidVolume: 4,
        ask: '250100000000000000000',
        askVolume: 6,
        lastTradedPrice: '250000000000000000000',
        marketStatus: reportMarketStatus,
        decimals: 18,
      },
      statusCode: 200,
    }))
    .persist()

// The nyse 24/5 schedule around the fixed now: Friday sessions (the post-market
// end, 20:00 ET, is the closed-span start), the Sunday overnight open, and Monday's
// sessions (needed so marketSessionOverride=REGULAR finds a future start).
const marketSessionResult = [
  {
    status: 1,
    statusString: 'PRE_MARKET',
    time: '2024-01-05T04:00:00-05:00',
    endTime: '2024-01-05T09:30:00-05:00',
  },
  {
    status: 2,
    statusString: 'REGULAR',
    time: '2024-01-05T09:30:00-05:00',
    endTime: '2024-01-05T16:00:00-05:00',
  },
  {
    status: 3,
    statusString: 'POST_MARKET',
    time: '2024-01-05T16:00:00-05:00',
    endTime: '2024-01-05T20:00:00-05:00',
  },
  {
    status: 4,
    statusString: 'OVERNIGHT',
    time: '2024-01-07T20:00:00-05:00',
    endTime: '2024-01-08T04:00:00-05:00',
  },
  {
    status: 1,
    statusString: 'PRE_MARKET',
    time: '2024-01-08T04:00:00-05:00',
    endTime: '2024-01-08T09:30:00-05:00',
  },
  {
    status: 2,
    statusString: 'REGULAR',
    time: '2024-01-08T09:30:00-05:00',
    endTime: '2024-01-08T16:00:00-05:00',
  },
]

let tradinghoursFails = false

const mockTradingHours = (): nock.Scope =>
  nock('http://tradinghours', { encodedQueryParams: true })
    .post('/', (body) => body?.data?.endpoint === 'market-session')
    .reply(() =>
      tradinghoursFails
        ? // EA-shaped error (HTTP 200, statusCode 500 in the body) — a bare HTTP 500
          // is retried by the Requester until the request times out (504) instead of
          // exercising the EA-level failure path gating falls back on.
          [200, { statusCode: 500 }]
        : [200, { result: null, data: { result: marketSessionResult }, statusCode: 200 }],
    )
    .persist()

describe('issuer-price-247 session-start gating (flag on)', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.DATA_ENGINE_ADAPTER_URL = 'http://data-engine'
    process.env.TRADING_HOURS_ADAPTER_URL = 'http://tradinghours'
    process.env.ETHEREUM_RPC_URL = 'fake-eth-url'
    process.env.BASE_RPC_URL = 'fake-base-url'
    process.env.ROBINHOOD_MAINNET_RPC_URL = 'fake-robinhood-url'
    process.env.ROBINHOOD_MAINNET_CHAIN_ID = '4663'
    process.env.BACKGROUND_EXECUTE_MS = process.env.BACKGROUND_EXECUTE_MS ?? '1000'
    process.env.ISSUER_247_SESSION_START_GATING_ENABLED = 'true'
    process.env.ALLOW_MARKET_SESSION_OVERRIDE = 'true'
    spy = jest.spyOn(Date, 'now').mockReturnValue(NOW)

    mockDataEngine()
    mockTradingHours()

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

  beforeEach(() => {
    reportMarketStatus = 5
    reportLastSeen = ns('2024-01-06T14:00:00.000Z') // Sat 09:00 ET
    tradinghoursFails = false
  })

  const request = (overrides: Record<string, unknown> = {}) =>
    testAdapter.request({
      endpoint: 'issuer-price-247',
      targetEndpoint: 'v11',
      feedId: freshFeedId(),
      resultPath: 'lastTradedPrice',
      decimals: 8,
      ...overrides,
    })

  it('serves an in-session WEEKEND report (lastSeen after the Friday close) with the schedule source on the response', async () => {
    const response = await request()
    expect(response.statusCode).toBe(200)
    expect(response.json().data.gatingSessionSource).toBe('TRADINGHOURS')
  })

  it('rejects 503 PRE_SESSION a weekend-served report stamped before the Friday close (previous-session leftover)', async () => {
    reportLastSeen = ns('2024-01-06T00:30:00.000Z') // Fri 19:30 ET — before the 20:00 ET close
    const response = await request()
    expect(response.statusCode).toBe(503)
    expect(JSON.stringify(response.json())).toContain('Market data predates session start')
    expect(JSON.stringify(response.json())).toContain('PRE_SESSION(WEEKEND')
  })

  it('rejects 503 PRE_SESSION a REGULAR report timestamped before the regular open', async () => {
    // Friday 09:00 ET: the regular session opened 09:30 ET; a report stamped 09:29
    // ET is a pre-open leftover even though it is seconds old.
    reportMarketStatus = 2 // REGULAR
    reportLastSeen = ns('2024-01-05T14:29:00.000Z') // Fri 09:29 ET
    const response = await request()
    expect(response.statusCode).toBe(503)
    expect(JSON.stringify(response.json())).toContain('PRE_SESSION(REGULAR')
  })

  it('fails closed with 503 Session start unknown on UNKNOWN marketStatus (fail-on-indeterminate default)', async () => {
    reportMarketStatus = 0
    const response = await request()
    expect(response.statusCode).toBe(503)
    expect(JSON.stringify(response.json())).toContain('Session start unknown')
  })

  it('gates on the fallback schedule (source FALLBACK) when tradinghours is down', async () => {
    tradinghoursFails = true
    const response = await request()
    expect(response.statusCode).toBe(200)
    expect(response.json().data.gatingSessionSource).toBe('FALLBACK')
  })

  it('still rejects pre-close leftovers on the fallback schedule when tradinghours is down', async () => {
    tradinghoursFails = true
    reportLastSeen = ns('2024-01-06T00:30:00.000Z') // Fri 19:30 ET
    const response = await request()
    expect(response.statusCode).toBe(503)
    expect(JSON.stringify(response.json())).toContain('PRE_SESSION(WEEKEND')
  })

  it('marketSessionOverride forces the genuine PRE_SESSION path, marked in the message', async () => {
    reportMarketStatus = 2 // REGULAR
    const response = await request({ marketSessionOverride: 'REGULAR' })
    expect(response.statusCode).toBe(503)
    expect(JSON.stringify(response.json())).toContain('PRE_SESSION(REGULAR')
    expect(JSON.stringify(response.json())).toContain('[marketSessionOverride=REGULAR]')
  })

  it('rejects 400 a marketSessionOverride request when the endpoint gating is misconfigured for it', async () => {
    // ALLOW_MARKET_SESSION_OVERRIDE is on here, so a bogus value fails input
    // validation instead (UNKNOWN/WEEKEND can never match a tradinghours transition).
    const response = await request({ marketSessionOverride: 'WEEKEND' })
    expect(response.statusCode).toBe(400)
  })
})
