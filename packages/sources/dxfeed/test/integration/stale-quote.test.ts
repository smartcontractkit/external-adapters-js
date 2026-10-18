import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { mockDxLinkServer, setFeedData } from './dxlink-mocks'

// Captured before FakeTimers.install() replaces the global timers: the mock
// socket bridge delivers frames on a REAL timer, so every step yields fake
// time (background cycles) AND real time (frame delivery).
const realSetTimeout = setTimeout

const WS_URL = 'ws://localhost:9111/dxlink-chainlink'

// Spec endpoint_request_response_examples request (stock_quotes); the
// dxlink-mocks.ts default frame carries the spec sample values for AAPL:USLF24
// (bid 189.95 / ask 190.05, time 1760000000000)
const aaplRequest = {
  endpoint: 'stock_quotes',
  from: 'AAPL',
  to: 'USD',
  overrides: {
    dxfeed: {
      AAPL: 'AAPL:USLF24',
    },
  },
}

// A dedicated symbol whose stream goes quiet after its single quote — the
// staleness flow never races another frame for the same wire key
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

describe('stale quote serving on the dxLink transport (plan proving test)', () => {
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
    // ws:// loopback test bridge served by the framework's mock-socket test
    // support: the adapter-owned ALLOW_PLAINTEXT_WS_TEST flag is the ONLY thing
    // that admits the plaintext ws:// endpoint (startup + request-time gate)
    process.env['ALLOW_PLAINTEXT_WS_TEST'] = 'true'
    process.env['API_USERNAME'] = process.env['API_USERNAME'] ?? 'fake-api-username'
    process.env['API_PASSWORD'] = process.env['API_PASSWORD'] ?? 'fake-api-password'
    process.env['WS_SUBSCRIPTION_TTL'] = '60000'
    process.env['CACHE_MAX_AGE'] = '600000'
    process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
    // The freshness guard reports staleness through the framework metrics only
    // (degraded_stream_alerting = metrics_counters_only); enable metrics so the
    // report channel this plan item relies on is exercised
    process.env['METRICS_ENABLED'] = 'true'

    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockDxLinkServer(WS_URL)

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install({ now: Date.parse('2026-01-01T00:00:00Z') }),
      testAdapter: {} as TestAdapter<never>,
    })

    await requestUntilCached(aaplRequest)
    await requestUntilCached(quietRequest)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  it('serves the last value with its ORIGINAL providerIndicatedTimeUnixMs and statusCode 200 after the mock feed goes quiet', async () => {
    // Owner decision stale_quote_serving = serve_last_value_with_timestamp
    // (template freshness-stale-t-guard, track-and-report mode only): the feed
    // stops pushing, several background cycles run with no frames, and the
    // last served value keeps flowing with its ORIGINAL provider timestamp —
    // no max-age rejection, no error envelope.
    for (let i = 0; i < 5; i++) {
      await step()
    }

    const response = await testAdapter.request(aaplRequest)
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
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
    })
    expect(response.json().errorMessage).toBeUndefined()

    const quiet = await testAdapter.request(quietRequest)
    expect(quiet.statusCode).toBe(200)
    expect(quiet.json()).toMatchObject({
      result: 50.1,
      timestamps: {
        providerIndicatedTimeUnixMs: 1760000002000,
      },
    })
    expect(quiet.json().errorMessage).toBeUndefined()
  })
})
