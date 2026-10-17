import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { dxLinkConnections, mockDxLinkServer, setFeedData } from './fixtures'

/**
 * Owner-decision proving flows (OPDATA-9200, served behaviorally
 * through the real request path):
 * - reconnect_cache_behavior = serve_cached_last_value: after the provider
 *   closes the channel, a request during the reconnect + re-handshake window
 *   returns the cached last value with its ORIGINAL provider timestamp and
 *   statusCode 200 — never an error.
 * - stale_quote_serving = serve_last_value_with_timestamp: after the stream
 *   goes quiet (markets closed), the last value keeps flowing with its original
 *   provider timestamp — no max-age rejection.
 * - degraded_stream_alerting = metrics_counters_only: behaviorally, no error
 *   envelope ever surfaces to the caller; staleness/degradation is reported
 *   through the framework's guard metrics only.
 */

// Captured before FakeTimers.install() replaces the global timers: the mock
// socket bridge delivers frames on a REAL timer, so every step yields fake
// time (background cycles) AND real time (frame delivery).
const realSetTimeout = setTimeout

const WS_URL = 'ws://localhost:9098/dxlink-chainlink'

// Spec endpoint_request_response_examples request (stock_quotes, AAPL)
const quoteRequest = {
  endpoint: 'stock_quotes',
  from: 'AAPL',
  to: 'USD',
  overrides: {
    dxfeed: {
      AAPL: 'AAPL:USLF24',
    },
  },
}

// Spec stock_quotes sample_response values for AAPL:USLF24
const cachedExampleResponse = {
  data: {
    mid_price: 190.0,
    bid_price: 189.95,
    bid_volume: 100,
    ask_price: 190.05,
    ask_volume: 200,
  },
  result: 190.0,
  timestamps: {
    providerIndicatedTimeUnixMs: 1760000000000,
  },
}

// A second symbol whose stream goes quiet after one quote (staleness flow)
setFeedData('Quote', 'QUIET:USLF24', [
  'Quote',
  'QUIET:USLF24',
  1760000002000,
  50.0,
  50.2,
  10,
  20,
  'V',
  'V',
])

const quietRequest = {
  endpoint: 'stock_quotes',
  from: 'QUIET',
  to: 'USD',
  overrides: {
    dxfeed: {
      QUIET: 'QUIET:USLF24',
    },
  },
}

describe('stale serving and reconnect cache behavior', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  const step = async () => {
    await testAdapter.clock?.tickAsync(1000)
    await new Promise((resolve) => realSetTimeout(resolve, 10))
  }

  // WS subscription semantics: the first request subscribes and may 504 while
  // the bridge delivers the handshake + FEED_DATA frames; poll deterministically
  // until the cache holds the value at `untilTimestamp` (any value when omitted)
  const requestUntilCached = async (
    params: Record<string, unknown>,
    untilTimestamp?: number,
  ): Promise<{ statusCode: number; json: () => any }> => {
    let response = await testAdapter.request(params)
    const ready = (r: { statusCode: number; json: () => any }) =>
      r.statusCode !== 504 &&
      (untilTimestamp === undefined ||
        r.json()?.timestamps?.providerIndicatedTimeUnixMs === untilTimestamp)
    for (let i = 0; i < 20 && !ready(response); i++) {
      await step()
      response = await testAdapter.request(params)
    }
    return response
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_API_ENDPOINT'] = WS_URL
    // ws:// loopback test bridge: the config accepts loopback ws:// with a
    // warning (no opt-in flag — ALLOW_INSECURE_LOOPBACK_WS is a retired no-op)
    process.env['API_USERNAME'] = process.env['API_USERNAME'] ?? 'fake-api-username'
    process.env['API_PASSWORD'] = process.env['API_PASSWORD'] ?? 'fake-api-password'
    process.env['WS_SUBSCRIPTION_TTL'] = '60000'
    process.env['CACHE_MAX_AGE'] = '600000'
    process.env['CACHE_POLLING_MAX_RETRIES'] = '0'

    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockDxLinkServer(WS_URL)

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install({ now: Date.parse('2026-01-01T00:00:00Z') }),
      testAdapter: {} as TestAdapter<never>,
    })

    // Warm the cache with the spec example quote
    await requestUntilCached(quoteRequest)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  it('serves the cached last value with its original timestamp during the reconnect window, then the fresh value after the re-handshake', async () => {
    // Provider closes the connection outright. Only the stock_quotes endpoint
    // runs in this suite, so connection 0 is its dxLink session.
    dxLinkConnections[0]?.close()
    await step()

    // Request during the reconnect + re-handshake window: the cached spec
    // example value with its ORIGINAL provider timestamp, statusCode 200,
    // and no error envelope (metrics_counters_only alerting)
    const duringReconnect = await testAdapter.request(quoteRequest)
    expect(duringReconnect.statusCode).toBe(200)
    expect(duringReconnect.json()).toMatchObject(cachedExampleResponse)
    expect(duringReconnect.json().errorMessage).toBeUndefined()

    // The quote the re-subscription receives after the re-handshake
    setFeedData('Quote', 'AAPL:USLF24', [
      'Quote',
      'AAPL:USLF24',
      1760000010000,
      190.0,
      190.5,
      110,
      120,
      'V',
      'V',
    ])

    // The mock server re-delivers the currently registered frame on each
    // FEED_SUBSCRIPTION re-add, so drop the re-established connection: the
    // next re-handshake's resubscription picks up the fresh quote.
    dxLinkConnections[dxLinkConnections.length - 1]?.close()

    const afterReconnect = await requestUntilCached(quoteRequest, 1760000010000)
    expect(afterReconnect.statusCode).toBe(200)
    expect(afterReconnect.json()).toMatchObject({
      data: {
        mid_price: 190.25,
        bid_price: 190.0,
        bid_volume: 110,
        ask_price: 190.5,
        ask_volume: 120,
      },
      result: 190.25,
      timestamps: {
        providerIndicatedTimeUnixMs: 1760000010000,
      },
    })
  })

  it('serves the last value with its original provider timestamp after the stream goes quiet, with no max-age rejection', async () => {
    // Warm the QUIET subscription (its only quote ever)
    const warmed = await requestUntilCached(quietRequest)
    expect(warmed.statusCode).toBe(200)
    expect(warmed.json()).toMatchObject({
      result: 50.1,
      timestamps: { providerIndicatedTimeUnixMs: 1760000002000 },
    })

    // Markets close: several background cycles run with no frames pushed and
    // no request traffic. The last value keeps flowing with its original
    // provider timestamp — no max-age rejection, no error envelope (the
    // staleness guard reports through metrics only).
    for (let i = 0; i < 5; i++) {
      await step()
    }

    const stale = await testAdapter.request(quietRequest)
    expect(stale.statusCode).toBe(200)
    expect(stale.json()).toMatchObject({
      data: {
        mid_price: 50.1,
        bid_price: 50.0,
        bid_volume: 10,
        ask_price: 50.2,
        ask_volume: 20,
      },
      result: 50.1,
      timestamps: {
        providerIndicatedTimeUnixMs: 1760000002000,
      },
    })
    expect(stale.json().errorMessage).toBeUndefined()
  })
})
