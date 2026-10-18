import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import {
  clientFrameLog,
  dxLinkConnections,
  mockDxLinkServer,
  sendToLastConnection,
  setFeedData,
  setFeedDataRecords,
} from './dxlink-mocks'

/**
 * Plan proving test (round1-keepalive-metrics, OPDATA-9200):
 * - a KEEPALIVE frame leaves every 30s (WS_HEARTBEAT_INTERVAL_MS=30000; spec
 *   keepalive.interval_seconds=30) so the session stays alive through a quiet
 *   window
 * - after a server close the transport reconnects, re-handshakes (the
 *   primary_command sequence again) and resubscribes (the desired
 *   FEED_SUBSCRIPTION add set on the new connection's wire)
 * - during the reconnect window a request receives the cached last value with
 *   its original providerIndicatedTimeUnixMs, never an error (owner decision
 *   reconnect_cache_behavior = serve_cached_last_value)
 * - a degraded stream (ERROR storm, forced drop) surfaces through the framework
 *   metrics counters only — never a hard failure (owner decision
 *   degraded_stream_alerting = metrics_counters_only)
 *
 * Fake loopback host only (test_fake_urls).
 */

// Captured before FakeTimers.install() replaces the global timers: the mock
// socket bridge delivers frames on a REAL timer, so every step yields fake
// time (background cycles, heartbeat interval) AND real time (frame delivery).
const realSetTimeout = setTimeout

const WS_URL = 'ws://localhost:9109/dxlink-chainlink'

// The spec stock_quotes sample_response's verbatim COMPACT frame (two Quote
// records); the spec example response derives from the newest (second) record.
setFeedDataRecords('Quote', 'AAPL:USLF24', [
  ['Quote', 'AAPL:USLF24', 1760000000000, 189.95, 190.05, 100, 200, 'V', 'V'],
  ['Quote', 'AAPL:USLF24', 1760000001000, 189.9, 190.1, 50, 80, 'O', 'O'],
])

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

const SPEC_EXAMPLE = {
  data: {
    mid_price: 190.0,
    bid_price: 189.9,
    bid_volume: 50,
    ask_price: 190.1,
    ask_volume: 80,
  },
  result: 190.0,
  timestamps: {
    providerIndicatedTimeUnixMs: 1760000001000,
  },
}

type AnyMsg = Record<string, any>

const parseFrame = (raw: string): AnyMsg | undefined => {
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

describe('keepalive, reconnect + resubscribe, cached-value windows', () => {
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

  /** The FEED_SUBSCRIPTION add entries on the given connection's wire. */
  const subscriptionAdds = (connIndex: number): { symbol: string; type: string }[] =>
    (clientFrameLog[connIndex] ?? [])
      .map(parseFrame)
      .filter((m): m is AnyMsg => Boolean(m))
      .filter((m) => m.type === 'FEED_SUBSCRIPTION')
      .flatMap((m) => m.add ?? [])

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_API_ENDPOINT'] = WS_URL
    // ws:// loopback test bridge: the adapter-owned ALLOW_PLAINTEXT_WS_TEST flag
    // is the ONLY thing that admits the plaintext ws:// endpoint
    process.env['ALLOW_PLAINTEXT_WS_TEST'] = 'true'
    process.env['API_USERNAME'] = process.env['API_USERNAME'] ?? 'fake-api-username'
    process.env['API_PASSWORD'] = process.env['API_PASSWORD'] ?? 'fake-api-password'
    // Prompt, deterministic reconnects across the forced drops below
    process.env['STREAM_HANDLER_RETRY_MIN_MS'] = '100'
    process.env['STREAM_HANDLER_RETRY_EXP_FACTOR'] = '1'
    process.env['STREAM_HANDLER_RETRY_MAX_MS'] = '3000'
    process.env['WS_SUBSCRIPTION_TTL'] = '60000'
    process.env['CACHE_MAX_AGE'] = '600000'
    process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
    // Metrics counters on (degraded_stream_alerting = metrics_counters_only):
    // the degraded-stream test scrapes the framework counters through
    // testAdapter.getMetrics(). The root test script exports
    // METRICS_ENABLED=false; this override must precede the adapter import.
    process.env['METRICS_ENABLED'] = 'true'

    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockDxLinkServer(WS_URL)

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install({ now: Date.parse('2026-01-01T00:00:00Z') }),
      testAdapter: {} as TestAdapter<never>,
    })

    // Warm the cache: the spec example flows through handshake -> subscribe ->
    // FEED_DATA on the suite's single dxLink connection (connection 0)
    await requestUntilCached(quoteRequest, 1760000001000)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  it('sends KEEPALIVE frames on the spec 30s interval so the session stays alive through a quiet window', async () => {
    // 40 ticks = 40s: past the first 30s keepalive beat, inside the 60s
    // subscription TTL and the 10min cache max-age. The wire frames are
    // observed through the per-connection frame logs registered at connection
    // time — the .some() assertion tolerates the earlier handshake and
    // subscription frames.
    for (let i = 0; i < 40; i++) {
      await step()
    }
    const sent = clientFrameLog
      .flat()
      .map(parseFrame)
      .filter((m): m is AnyMsg => Boolean(m))
    expect(sent.some((m) => m.type === 'KEEPALIVE')).toBe(true)

    // Behavioral consequence on the real request path: the session is still
    // alive and the warmed spec example value keeps serving
    const response = await testAdapter.request(quoteRequest)
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject(SPEC_EXAMPLE)
  })

  it('reconnects, re-handshakes and resubscribes after a server close, serving the cached last value during the window', async () => {
    // Provider drops the connection. The framework reconnects (a new
    // connection is registered), re-runs the handshake and resubscribes the
    // desired set; the cached last value serves through the whole window.
    const connectionsBefore = dxLinkConnections.length
    dxLinkConnections[0]?.close()
    for (let i = 0; i < 20 && dxLinkConnections.length <= connectionsBefore; i++) {
      await step()
    }
    expect(dxLinkConnections.length).toBeGreaterThan(connectionsBefore)

    // During the reconnect + re-handshake window: the cached last value with
    // its ORIGINAL provider timestamp, statusCode 200, no error envelope
    const duringReconnect = await testAdapter.request(quoteRequest)
    expect(duringReconnect.statusCode).toBe(200)
    expect(duringReconnect.json()).toMatchObject(SPEC_EXAMPLE)
    expect(duringReconnect.json().errorMessage).toBeUndefined()

    // The re-established session re-ran the primary_command handshake...
    const newConnIndex = dxLinkConnections.length - 1
    const newConnFrames = (clientFrameLog[newConnIndex] ?? [])
      .map(parseFrame)
      .filter((m): m is AnyMsg => Boolean(m))
    expect(newConnFrames.slice(0, 3).map((m) => m.type)).toEqual([
      'SETUP',
      'CHANNEL_REQUEST',
      'FEED_SETUP',
    ])
    // ...and resubscribed the desired set on the wire
    expect(subscriptionAdds(newConnIndex)).toContainEqual({
      symbol: 'AAPL:USLF24',
      type: 'Quote',
    })

    // The fresh quote the re-subscription picks up: the mock server re-delivers
    // the currently registered frame on each FEED_SUBSCRIPTION re-add, so
    // register it, then drop the re-established connection for the next
    // re-handshake to deliver it.
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

  it('reconnects and resubscribes on a provider CHANNEL_CLOSED frame, the cached last value serving through the window', async () => {
    // An in-band CHANNEL_CLOSED frame must close the socket so the framework
    // runs its reconnect + resubscribe path — the new connection's wire carries
    // the FEED_SUBSCRIPTION add again — while the cached last value keeps
    // serving, never an error.
    const before = await testAdapter.request(quoteRequest)
    expect(before.statusCode).toBe(200)
    expect(before.json()).toMatchObject({
      data: {
        mid_price: 190.25,
        bid_price: 190.0,
        bid_volume: 110,
        ask_price: 190.5,
        ask_volume: 120,
      },
      result: 190.25,
      timestamps: { providerIndicatedTimeUnixMs: 1760000010000 },
    })

    expect(
      sendToLastConnection({
        type: 'CHANNEL_CLOSED',
        channel: 1,
        eventType: 'Quote',
        symbol: 'AAPL:USLF24',
      }),
    ).toBe(true)

    // The frame closes the socket: wait for the re-established connection and
    // its resubscription add
    const connectionsBefore = dxLinkConnections.length
    let resubscribed = false
    for (let i = 0; i < 20 && !resubscribed; i++) {
      await step()
      resubscribed = subscriptionAdds(dxLinkConnections.length - 1).some(
        (e) => e.symbol === 'AAPL:USLF24' && e.type === 'Quote',
      )
    }
    expect(dxLinkConnections.length).toBeGreaterThan(connectionsBefore)
    expect(resubscribed).toBe(true)

    // Through the window: the cached last value, original timestamp, no error
    const after = await testAdapter.request(quoteRequest)
    expect(after.statusCode).toBe(200)
    expect(after.json()).toMatchObject({
      data: {
        mid_price: 190.25,
        bid_price: 190.0,
        bid_volume: 110,
        ask_price: 190.5,
        ask_volume: 120,
      },
      result: 190.25,
      timestamps: { providerIndicatedTimeUnixMs: 1760000010000 },
    })
    expect(after.json().errorMessage).toBeUndefined()
  })

  it('answers an ERROR storm plus a forced drop with the cached last value and metrics counters, never a hard failure', async () => {
    // Owner decision degraded_stream_alerting = metrics_counters_only: a storm
    // of provider ERROR control frames plus a forced connection drop must
    // (a) never surface a hard error — the cached last value keeps flowing with
    // statusCode 200 — and (b) show up in the framework metrics counters
    // (ws_connection_closures records every forced reconnect closure).
    for (let i = 0; i < 5; i++) {
      expect(
        sendToLastConnection({
          type: 'ERROR',
          channel: 1,
          code: 'UNAUTHORIZED',
          message: 'test: error storm',
        }),
      ).toBe(true)
    }
    await step()

    dxLinkConnections[dxLinkConnections.length - 1]?.close()
    await step()

    const during = await testAdapter.request(quoteRequest)
    expect(during.statusCode).toBe(200)
    expect(during.json()).toMatchObject({
      data: {
        mid_price: 190.25,
        bid_price: 190.0,
        bid_volume: 110,
        ask_price: 190.5,
        ask_volume: 120,
      },
      result: 190.25,
      timestamps: { providerIndicatedTimeUnixMs: 1760000010000 },
    })
    expect(during.json().errorMessage).toBeUndefined()

    // Sums every scraped sample of one prom-client metric (TestMetrics keys are
    // `${metric_name}|${sorted_labels}`)
    const metrics = await testAdapter.getMetrics()
    const closureSum = [...metrics.map.entries()]
      .filter(([key]) => key.startsWith('ws_connection_closures|'))
      .reduce((sum, [, value]) => sum + value, 0)
    expect(closureSum).toBeGreaterThan(0)
  })
})
