import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'

// marketSessionOverride is a staging/test hook for the session-start check. It is
// rejected with 400 unless ALLOW_MARKET_SESSION_OVERRIDE=true (unit-tested in
// smoothedPrice.sessionStart.test.ts), and — even when allowed — rejected with 400
// when SESSION_START_GATING_ENABLED is unset (tested here) rather than silently
// ignored; UNKNOWN/WEEKEND are rejected with 400 by input validation in any
// case (they can never match a tradinghours transition). An adapter can only boot
// once per test file, so this lives apart from adapter-price-session-start.test.ts
// (which boots with the check enabled).

const NOW_MS = new Date('2001-01-01T11:11:11.111Z').getTime()

describe('price endpoint session-start gating disabled', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  const requestData = {
    asset: '0x0',
    regularStreamId: '0x000a5',
    extendedStreamId: '0x000b6',
    overnightStreamId: '0x000c7',
    sessionMarket: 'nyse',
    sessionMarketType: '24/5',
    sessionBoundariesTimeZone: 'America/New_York',
    smoother: 'ema' as const,
    decimals: 8,
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.DATA_ENGINE_ADAPTER_URL = 'http://data-engine'
    process.env.TRADING_HOURS_ADAPTER_URL = 'http://trading-hours'
    process.env.BACKGROUND_EXECUTE_MS = process.env.BACKGROUND_EXECUTE_MS ?? '1000'
    delete process.env.SESSION_START_GATING_ENABLED
    process.env.ALLOW_MARKET_SESSION_OVERRIDE = 'true'
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

  it('rejects marketSessionOverride with 400 when SESSION_START_GATING_ENABLED is unset', async () => {
    const response = await testAdapter.request({
      ...requestData,
      marketSessionOverride: 'REGULAR',
    })

    expect(response.statusCode).toBe(400)
    expect(JSON.stringify(response.json())).toMatch(
      /marketSessionOverride requires SESSION_START_GATING_ENABLED=true/,
    )
  })

  it.each([['UNKNOWN'], ['WEEKEND']])(
    'rejects marketSessionOverride=%s with 400 (never matches a tradinghours transition)',
    async (override) => {
      const response = await testAdapter.request({
        ...requestData,
        marketSessionOverride: override,
      })

      expect(response.statusCode).toBe(400)
    },
  )

  it("makes no tradinghours call for a smoother 'none' feed with market identity when gating is off", async () => {
    // The schedule is consumed by the gate (off here) and the smoother's
    // seconds-from-transition signal (absent for smoother 'none') — so the fetch must
    // be skipped entirely. No tradinghours mock is registered: any attempted call
    // would fail the request.
    nock('http://data-engine', { encodedQueryParams: true })
      .post('/')
      .reply(200, () => ({
        data: {
          mid: '1',
          lastSeenTimestampNs: String(BigInt(NOW_MS) * 10n ** 6n),
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

    const response = await testAdapter.request({
      asset: '0x0',
      extendedStreamId: '0x000b6-none-market-flagoff',
      sessionMarket: 'nyse',
      sessionMarketType: '24/5',
      smoother: 'none',
      decimals: 8,
    })

    expect(response.statusCode).toBe(200)
  })
})
