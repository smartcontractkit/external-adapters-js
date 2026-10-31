import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'

// PR1 checkpoint 1 (DF-28181): with no DS_VALID_MAX_AGE_SECONDS configured the staleness check
// is disabled and stale reports pass through — the safe-rollout/rollback behavior. An adapter
// can only boot once per test file, so this lives apart from adapter-price-staleness.test.ts
// (which boots with the check enabled).

const NOW_MS = new Date('2001-01-01T11:11:11.111Z').getTime()

const nsAtAge = (ageSeconds: number) =>
  String(BigInt(Math.round(NOW_MS - ageSeconds * 1000)) * 10n ** 6n)

describe('price endpoint staleness disabled (DF-28181)', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.DATA_ENGINE_ADAPTER_URL = 'http://data-engine'
    process.env.TRADING_HOURS_ADAPTER_URL = 'http://trading-hours'
    process.env.BACKGROUND_EXECUTE_MS = process.env.BACKGROUND_EXECUTE_MS ?? '1000'
    delete process.env.DS_VALID_MAX_AGE_SECONDS
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

  it('returns 200 for a stale report when the check is not configured', async () => {
    nock('http://data-engine', { encodedQueryParams: true })
      .post('/')
      .reply(200, () => ({
        data: {
          mid: '1',
          lastSeenTimestampNs: nsAtAge(4000),
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
      extendedStreamId: '0x000b6',
      smoother: 'none',
      decimals: 8,
    })

    expect(response.statusCode).toBe(200)
  })
})
