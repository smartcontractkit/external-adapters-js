import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
  TestMetrics,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { dxLinkConnections, mockDxLinkServer, sendToLastConnection } from './fixtures'

// Captured before FakeTimers.install() replaces the global timers: the mock
// socket bridge delivers frames on a REAL timer, so every step yields fake
// time (background cycles) AND real time (frame delivery).
const realSetTimeout = setTimeout

const WS_URL = 'ws://localhost:9094/dxlink-chainlink'

// Spec endpoint_request_response_examples request (stock_quotes)
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

// Prometheus exposition names of the framework ws counters
// (owner decision degraded_stream_alerting = metrics_counters_only)
const closuresSum = (metrics: TestMetrics): number =>
  [...metrics.map.entries()]
    .filter(([key]) => key.startsWith('ws_connection_closures'))
    .reduce((acc, [, value]) => acc + value, 0)

const attemptsSum = (metrics: TestMetrics): number =>
  [...metrics.map.entries()]
    .filter(([key]) => key.startsWith('ws_connection_attempt'))
    .reduce((acc, [, value]) => acc + value, 0)

describe('degraded stream alerting', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  const step = async () => {
    await testAdapter.clock?.tickAsync(1000)
    await new Promise((resolve) => realSetTimeout(resolve, 10))
  }

  const requestUntilCached = async (
    params: Record<string, unknown>,
  ): Promise<{ statusCode: number; json: () => any }> => {
    let response = await testAdapter.request(params)
    for (let i = 0; i < 20 && response.statusCode === 504; i++) {
      await step()
      response = await testAdapter.request(params)
    }
    return response
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_API_ENDPOINT'] = WS_URL
    process.env['API_USERNAME'] = process.env['API_USERNAME'] ?? 'fake-api-username'
    process.env['API_PASSWORD'] = process.env['API_PASSWORD'] ?? 'fake-api-password'
    process.env['METRICS_ENABLED'] = 'true'
    process.env['METRICS_PORT'] = '9511'
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

    await requestUntilCached(quoteRequest)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  it('increments the ws counters on a provider drop and keeps serving the cached last value', async () => {
    const metricsBefore = await testAdapter.getMetrics()
    const closuresBefore = closuresSum(metricsBefore)
    const attemptsBefore = attemptsSum(metricsBefore)

    // Provider drops the connection; the adapter must reconnect, not error
    dxLinkConnections[0]?.close()
    for (let i = 0; i < 20 && dxLinkConnections.length < 2; i++) {
      await step()
    }
    expect(dxLinkConnections.length).toBeGreaterThanOrEqual(2)

    const metrics = await testAdapter.getMetrics()
    expect(closuresSum(metrics)).toBeGreaterThan(closuresBefore)
    expect(attemptsSum(metrics)).toBeGreaterThan(attemptsBefore)

    // Owner decision reconnect_cache_behavior = serve_cached_last_value: the
    // original spec example value is served through the reconnect window
    const response = await requestUntilCached(quoteRequest)
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      result: 190.0,
      timestamps: { providerIndicatedTimeUnixMs: 1760000000000 },
    })
  })

  it('serves the cached last value through a provider ERROR frame with no hard error', async () => {
    // Spec sample ERROR control frame: degraded_stream_alerting
    // = metrics_counters_only means the frame is not surfaced as an error —
    // the cached value keeps flowing
    expect(
      sendToLastConnection({
        type: 'ERROR',
        channel: 1,
        code: 'UNAUTHORIZED',
        message: 'test: not authorized',
      }),
    ).toBe(true)
    await step()

    const response = await requestUntilCached(quoteRequest)
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      result: 190.0,
      timestamps: { providerIndicatedTimeUnixMs: 1760000000000 },
    })
  })

  it('serves the last value with its original provider timestamp after the stream goes quiet', async () => {
    // Owner decision stale_quote_serving = serve_last_value_with_timestamp:
    // markets close, the Quote/Trade stream goes quiet, and the EA keeps
    // serving the last value with its original provider timestamp — no
    // max-age rejection, no error. Several background cycles run with no
    // frames pushed before the request.
    for (let i = 0; i < 5; i++) {
      await step()
    }

    const response = await testAdapter.request(quoteRequest)
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      result: 190.0,
      timestamps: { providerIndicatedTimeUnixMs: 1760000000000 },
    })
  })

  it('serves the cached last value through a provider CHANNEL_CLOSED frame with no hard error', async () => {
    // Spec reconnect_cache_behavior = serve_cached_last_value: a
    // CHANNEL_CLOSED control frame puts the adapter into the reconnect +
    // re-handshake window; requests during that window return the cached last
    // value, not an error.
    expect(
      sendToLastConnection({
        type: 'CHANNEL_CLOSED',
        channel: 1,
        eventType: 'Quote',
        symbol: 'AAPL:USLF24',
      }),
    ).toBe(true)
    await step()

    const response = await requestUntilCached(quoteRequest)
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      result: 190.0,
      timestamps: { providerIndicatedTimeUnixMs: 1760000000000 },
    })
  })
})
