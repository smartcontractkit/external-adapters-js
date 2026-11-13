/**
 * dxfeed freshness policy — the requirement's newest-time rule, driven through
 * the framework's own test pattern (cfbenchmarks reference): requests in
 * beforeAll + waitForCache (the framework drains its own timer queue), then
 * direct cache-hit requests per test. Bounded ticks between tests; the
 * deadlocking await-request-then-tick choreography is gone (the foreground
 * poll's fake-clock sleeps cannot advance while a test awaits the request).
 */
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers, { type InstalledClock } from '@sinonjs/fake-timers'
import { quoteFrame, quoteRecord, ScriptedDxLinkServer } from '../fixtures'

const WS_URL = 'ws://localhost:9096/dxlink-freshness'
const PROVIDER_TIME = 1760000001000

describe('dxfeed freshness policy', () => {
  let oldEnv: NodeJS.ProcessEnv
  let server: ScriptedDxLinkServer
  let testAdapter: TestAdapter

  const request = {
    base: 'GUARD',
    quote: 'USD',
    endpoint: 'stock_quotes',
    overrides: { dxfeed: { GUARD: 'GUARD:USLF24' } },
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.WS_API_ENDPOINT = WS_URL
    process.env.API_USERNAME = 'fake-user'
    process.env.API_PASSWORD = 'fake-pass'
    process.env.CACHE_MAX_AGE = '5000'
    // Framework config validation caps WS_SUBSCRIPTION_*_TTL at 180000 — a
    // higher value rejects the adapter at init (the whole suite fails in
    // beforeAll).
    process.env.WS_SUBSCRIPTION_TTL = '180000'
    process.env.WS_SUBSCRIPTION_UNRESPONSIVE_TTL = '180000'
    process.env.WS_CONNECTION_OPEN_TIMEOUT = '2000'
    process.env.WS_HEARTBEAT_INTERVAL_MS = '5000'

    server = new ScriptedDxLinkServer(WS_URL)
    server.setFeedData('Quote', 'GUARD:USLF24', [
      quoteFrame(quoteRecord('GUARD:USLF24', PROVIDER_TIME, 189.9, 190.1, 50, 80, 'O', 'O')),
    ])

    mockWebSocketProvider(WebSocketClassProvider)
    const adapter = (await import('./../../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install({ now: Date.parse('2026-01-01T00:00:00Z') }),
      testAdapter: {} as TestAdapter<never>,
    })
    // the spec example response: newest Quote record wins
    await testAdapter.request(request)
    await testAdapter.waitForCache(1)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    server.server.close()
    ;(testAdapter.clock as InstalledClock | undefined)?.uninstall()
    await testAdapter.api.close()
  })

  it('serves the quote with the provider-indicated timestamp', async () => {
    const response = await testAdapter.request(request)
    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.data).toMatchObject({ bid_price: 189.9, ask_price: 190.1 })
    expect(body.data.mid_price).toBeCloseTo(190, 10)
    expect(body.timestamps?.providerIndicatedTimeUnixMs).toBe(PROVIDER_TIME)
  })

  it('drops back-dated frames and keeps the newest record', async () => {
    // a frame older than the accepted one: the guard drops it, the cached
    // value stays the accepted newest
    server.push(quoteFrame(quoteRecord('GUARD:USLF24', PROVIDER_TIME - 1000, 100, 101, 1, 2)))
    await testAdapter.clock?.tickAsync?.(500)
    const response = await testAdapter.request(request)
    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.data).toMatchObject({ bid_price: 189.9, ask_price: 190.1 })
    expect(body.timestamps?.providerIndicatedTimeUnixMs).toBe(PROVIDER_TIME)
  })

  it('serves the cached last value with its original timestamp within CACHE_MAX_AGE', async () => {
    // 3 s of quiet < CACHE_MAX_AGE (5000 here): the framework cache serves
    // the last value, original provider timestamp untouched.
    await testAdapter.clock?.tickAsync?.(3000)
    const response = await testAdapter.request(request)
    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.data).toMatchObject({ bid_price: 189.9, ask_price: 190.1 })
    expect(body.timestamps?.providerIndicatedTimeUnixMs).toBe(PROVIDER_TIME)
  })

  it('504s once the cached last value outlives CACHE_MAX_AGE', async () => {
    // 6 s of quiet > CACHE_MAX_AGE (5000 here): the entry expires. The
    // staleness bound is the framework's; the gap is visible (504), never
    // served forever.
    await testAdapter.clock?.tickAsync?.(6000)
    const response = await testAdapter.request(request)
    expect(response.statusCode).toBe(504)
  })

  it('serves an old-but-forward frame with its original timestamp (the guard is ordering-only)', async () => {
    // forward relative to the last accepted frame, far behind the wall clock:
    // still accepted and served with its own timestamp
    server.push(
      quoteFrame(quoteRecord('GUARD:USLF24', PROVIDER_TIME + 500, 189.8, 190.2, 40, 90, 'O', 'O')),
    )
    await testAdapter.clock?.tickAsync?.(500)
    const response = await testAdapter.request(request)
    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.data).toMatchObject({ bid_price: 189.8, ask_price: 190.2 })
    expect(body.timestamps?.providerIndicatedTimeUnixMs).toBe(PROVIDER_TIME + 500)
  })
})
