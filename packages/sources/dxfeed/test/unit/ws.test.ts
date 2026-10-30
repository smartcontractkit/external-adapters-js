/**
 * dxLink WebSocket transport tests — OPDATA-9200 spec.
 *
 * Everything is asserted from the spec's contract (dxLink handshake sequence,
 * Basic auth on the WS handshake, FEED_SUBSCRIPTION add/remove fanout,
 * KEEPALIVE, provider ERROR frames), through the adapter's real request path
 * against a scripted dxLink server. The legacy cometd transport (clientId,
 * /meta/connect heartbeats) is deleted and must not appear on the wire.
 */
import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers, { type InstalledClock } from '@sinonjs/fake-timers'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  awaitWs,
  errorFrame,
  flushFrames,
  keepaliveFrame,
  QUOTE_FIELDS,
  quoteFrame,
  quoteRecord,
  ScriptedDxLinkServer,
  TRADE_FIELDS,
  tradeFrame,
  tradeRecord,
} from './fixtures'

const WS_URL = 'ws://localhost:9092/dxlink'
// The adapter's src tree, for the static cometd-deletion check below.
const SRC_DIR = path.join(__dirname, '../../src')

describe('dxLink websocket transport', () => {
  let oldEnv: NodeJS.ProcessEnv
  let server: ScriptedDxLinkServer
  let testAdapter: TestAdapter
  let recordedSocketOptions: { url: string; options: any }[]

  const quoteRequest = { base: 'TSLA', quote: 'USD', endpoint: 'stock_quotes' }
  const priceRequest = {
    endpoint: 'stock',
    from: 'AAPL',
    to: 'USD',
    transport: 'ws',
    overrides: { dxfeed: { AAPL: 'AAPL:USLF24' } },
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.WS_API_ENDPOINT = WS_URL
    process.env.API_USERNAME = 'fake-user'
    process.env.API_PASSWORD = 'fake-pass'
    process.env.WS_SUBSCRIPTION_TTL = '60000'
    // Above any intra-file fake-clock gap, so no connection is ever closed as
    // unresponsive mid-suite (that would inject extra SETUPs/replays).
    process.env.WS_SUBSCRIPTION_UNRESPONSIVE_TTL = '180000'
    process.env.CACHE_MAX_AGE = '60000'
    process.env.WS_CONNECTION_OPEN_TIMEOUT = '2000'
    process.env.WS_HEARTBEAT_INTERVAL_MS = '5000'

    server = new ScriptedDxLinkServer(WS_URL)
    server.setFeedData('Quote', 'TSLA', [
      quoteFrame(quoteRecord('TSLA', 1760000002000, 100, 101, 1, 2)),
    ])
    server.setFeedData('Quote', 'AAPL:USLF24', [
      quoteFrame(
        quoteRecord('AAPL:USLF24', 1760000000000, 189.95, 190.05, 100, 200, 'V', 'V'),
        quoteRecord('AAPL:USLF24', 1760000001000, 189.9, 190.1, 50, 80, 'O', 'O'),
      ),
    ])
    server.setFeedData('Trade', 'AAPL:USLF24', [
      tradeFrame('Trade', tradeRecord('Trade', 'AAPL:USLF24', 1760000000000, 189.98)),
    ])
    server.setFeedData('TradeETH', 'AAPL:USLF24', [
      tradeFrame('TradeETH', tradeRecord('TradeETH', 'AAPL:USLF24', 500, 400)),
    ])
    server.setFeedData('Trade', 'TSLA', [
      tradeFrame('Trade', tradeRecord('Trade', 'TSLA', 1760000002000, 250)),
    ])
    server.setFeedData('Quote', 'GATE', [
      quoteFrame(quoteRecord('GATE', 1760000002000, 120, 121, 3, 4)),
    ])
    server.setFeedData('Quote', 'REMOVE:USLF24', [
      quoteFrame(quoteRecord('REMOVE:USLF24', 1760000002000, 130, 131, 5, 6)),
    ])

    mockWebSocketProvider(WebSocketClassProvider)
    // Idempotent: register the framework prom-client counters so the
    // metrics-verification test below can read counter deltas (the framework's
    // ws close handler increments wsConnectionClosures through this singleton).
    metrics.initialize()
    // Record the handshake options the adapter hands to the WebSocket client
    // (the framework passes transport options() straight to the ctor).
    recordedSocketOptions = []
    const MockedSocket = WebSocketClassProvider.get() as any
    class RecordingSocket extends MockedSocket {
      constructor(url: string, protocol?: unknown, options?: unknown) {
        recordedSocketOptions.push({ url, options })
        super(url, protocol)
      }
    }
    WebSocketClassProvider.set(RecordingSocket as any)

    const adapter = (await import('./../../src')).adapter
    // rateLimiting stays: undefined makes the fixed-interval period 0, which starves fake-timer ticks
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install({ now: Date.parse('2026-01-01T00:00:00Z') }),
      testAdapter: {} as TestAdapter<never>,
    })

    // Framework test pattern: fire the requests, then let the framework drain
    // its own timer queue until the cache holds both endpoints' entries
    // (quoteRequest + priceRequest). TestAdapter.request self-drains the
    // installed clock while the dxLink foreground gate waits for the
    // background stream to fill the cache.
    await testAdapter.request(quoteRequest)
    await testAdapter.request(priceRequest)
    await testAdapter.waitForCache(2)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    server.server.close()
    ;(testAdapter.clock as InstalledClock | undefined)?.uninstall()
    await testAdapter.api.close()
  })

  describe('handshake', () => {
    it('sends the Basic auth header on every websocket handshake', () => {
      expect(recordedSocketOptions.length).toBeGreaterThan(0)
      const expected = 'Basic ' + Buffer.from('fake-user:fake-pass').toString('base64')
      for (const { url, options } of recordedSocketOptions) {
        expect(url).toBe(WS_URL)
        expect(options?.headers?.Authorization).toBe(expected)
      }
    })

    it('runs the dxLink control handshake before any subscription', () => {
      const firstSubscription = server.clientMessages.findIndex(
        (m) => m.type === 'FEED_SUBSCRIPTION',
      )
      expect(firstSubscription).toBeGreaterThan(0)
      const control = server.clientMessages
        .slice(0, firstSubscription)
        .map((m) => m.type)
        .filter((t) => ['SETUP', 'CHANNEL_REQUEST', 'FEED_SETUP'].includes(t))
      expect(control).toEqual(['SETUP', 'CHANNEL_REQUEST', 'FEED_SETUP'])

      // Spec primary_command SETUP: channel 0 with the 60s dxLink keepalive
      // contract (the adapter's own KEEPALIVE send cadence is the separate
      // 30s WS_HEARTBEAT_INTERVAL_MS asserted in the heartbeat suite).
      // version per the spec primary_command's live-verified SETUP frame.
      expect(server.clientMessages.find((m) => m.type === 'SETUP')).toMatchObject({
        channel: 0,
        keepaliveTimeout: 60,
        acceptKeepaliveTimeout: 60,
        version: '0.1-js/1.0.0',
      })
      expect(server.clientMessages.find((m) => m.type === 'CHANNEL_REQUEST')).toMatchObject({
        channel: 1,
        service: 'FEED',
        parameters: { contract: 'AUTO' },
      })
      // Spec primary_command FEED_SETUP: 1s aggregation, COMPACT format, the
      // spec's exact event field lists for all three event types.
      expect(server.clientMessages.find((m) => m.type === 'FEED_SETUP')).toMatchObject({
        channel: 1,
        acceptAggregationPeriod: 1,
        acceptDataFormat: 'COMPACT',
        acceptEventFields: {
          Quote: [...QUOTE_FIELDS],
          Trade: [...TRADE_FIELDS],
          TradeETH: [...TRADE_FIELDS],
        },
      })
    })

    it('never puts cometd frames on the wire', () => {
      // No cometd meta channels or clientId handshakes may be sent.
      expect(server.clientMessages.some((m) => JSON.stringify(m).includes('/meta/'))).toBe(false)
      expect(server.clientMessages.some((m) => m.clientId !== undefined)).toBe(false)
      // Spec credentialNotes: the dxLink AUTH message "exists but is NOT
      // used" — credentials ride the HTTP Basic header on the upgrade only.
      expect(server.clientMessages.some((m) => m.type === 'AUTH')).toBe(false)
    })
  })

  describe('cometd transport deletion (plan round1-delete-cometd-transport)', () => {
    // Static counterpart to the on-the-wire checks above: the decommissioned
    // cometd transport module (src/transport/ws.ts) is deleted outright, and no
    // src file may import it or carry any cometd protocol marker (spec
    // exception cometd-transport-deletion: "No cometd behavior carries over").
    it('leaves no cometd module import or cometd protocol code anywhere in src/', () => {
      // The deleted module itself is gone.
      expect(existsSync(path.join(SRC_DIR, 'transport', 'ws.ts'))).toBe(false)

      // No surviving src file references it or any cometd protocol concept.
      const markers = [
        /from '\.\/ws'/, // relative import of the deleted transport module
        /transport\/ws/, // nested import of the deleted transport module
        /cometd/i, // the protocol/library itself
        /\/meta\//, // cometd meta channels (/meta/handshake, /meta/connect)
        /clientId/, // cometd handshake clientId
      ]
      const tsFiles: string[] = []
      const walk = (dir: string): void => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name)
          if (entry.isDirectory()) {
            walk(full)
          } else if (entry.name.endsWith('.ts')) {
            tsFiles.push(full)
          }
        }
      }
      walk(SRC_DIR)
      expect(tsFiles.length).toBeGreaterThan(0)

      const violations = tsFiles.flatMap((file) =>
        markers
          .filter((marker) => marker.test(readFileSync(file, 'utf8')))
          .map((marker) => `${path.relative(SRC_DIR, file)} matches ${marker}`),
      )
      expect(violations).toEqual([])
    })
  })

  describe('subscriptions', () => {
    it('subscribes Quote once per (symbol, eventType) and never duplicates it', async () => {
      expect(server.added().filter((s) => s.symbol === 'TSLA' && s.type === 'Quote')).toHaveLength(
        1,
      )
      // Re-request with identical params: no duplicate add may be sent.
      await testAdapter.request(quoteRequest)
      await flushFrames(testAdapter)
      expect(server.added().filter((s) => s.symbol === 'TSLA' && s.type === 'Quote')).toHaveLength(
        1,
      )
      for (const msg of server.clientMessages.filter((m) => m.type === 'FEED_SUBSCRIPTION')) {
        expect(Array.isArray(msg.add)).toBe(true)
      }
    })

    it('subscribes Trade and TradeETH for :USLF24 tickers', () => {
      expect(server.added()).toEqual(
        expect.arrayContaining([
          { symbol: 'AAPL:USLF24', type: 'Trade' },
          { symbol: 'AAPL:USLF24', type: 'TradeETH' },
        ]),
      )
    })

    it('subscribes Trade and TradeETH for a bare ticker (no :USLF24 gate)', async () => {
      // The awaited request self-drains the clock while the foreground gate
      // waits for the stream value, so the adds are on the wire by the time
      // the 200 comes back.
      const response = await testAdapter.request({
        endpoint: 'stock',
        from: 'TSLA',
        to: 'USD',
        transport: 'ws',
      })
      expect(response.statusCode).toBe(200)
      expect(server.added().some((s) => s.symbol === 'TSLA' && s.type === 'Trade')).toBe(true)
      expect(server.added().some((s) => s.symbol === 'TSLA' && s.type === 'TradeETH')).toBe(true)
    })

    it('subscribes Quote for the overridden :USLF24 ticker (stock_quotes)', async () => {
      // Plan proving case (round1-subscription-fanout): the SAME :USLF24
      // desired params must yield a Quote add from stock_quotes alongside the
      // Trade/TradeETH adds the price endpoint fans out.
      const response = await testAdapter.request({
        endpoint: 'stock_quotes',
        base: 'AAPL',
        quote: 'USD',
        overrides: { dxfeed: { AAPL: 'AAPL:USLF24' } },
      })
      expect(response.statusCode).toBe(200)
      await flushFrames(testAdapter)
      expect(server.added()).toEqual(
        expect.arrayContaining([{ symbol: 'AAPL:USLF24', type: 'Quote' }]),
      )
    })
  })

  describe('heartbeat', () => {
    it('sends KEEPALIVE on channel 0 on the WS_HEARTBEAT_INTERVAL_MS cadence', async () => {
      const countKeepalives = () =>
        server.clientMessages.filter((m) => m.type === 'KEEPALIVE').length
      // Four-plus fires inside a 4-intervals-plus-epsilon window pins the
      // KEEPALIVE cadence to WS_HEARTBEAT_INTERVAL_MS (5000 here): any window
      // of this length must contain >= 4 fires of a 5000ms periodic timer,
      // while a slower cadence (e.g. the framework's 10s default) cannot.
      // tickAsync fires the periodic timer synchronously as fake time
      // advances — no (real) sleep may be awaited under the installed clock.
      const before = countKeepalives()
      await testAdapter.clock?.tickAsync?.(4 * 5000 + 1000)
      expect(countKeepalives() - before).toBeGreaterThanOrEqual(4)
      for (const message of server.clientMessages.filter((m) => m.type === 'KEEPALIVE')) {
        expect(message).toMatchObject({ channel: 0 })
      }
    })
  })

  describe('provider error frames', () => {
    it('ignores ERROR frames without throwing or corrupting the stream', async () => {
      const before = await testAdapter.request(quoteRequest)
      expect(before.statusCode).toBe(200)

      server.push(errorFrame)
      server.push(keepaliveFrame)
      await flushFrames(testAdapter, 2000)

      // No ProviderResult was produced and no error thrown: the last good
      // value is still served, then newer data still flows.
      const after = await testAdapter.request(quoteRequest)
      expect(after.statusCode).toBe(200)
      expect(after.json().data).toMatchObject({ bid_price: 100, ask_price: 101 })

      server.push(quoteFrame(quoteRecord('TSLA', 1760000003000, 110, 111, 1, 2)))
      await flushFrames(testAdapter)
      const updated = await testAdapter.request(quoteRequest)
      expect(updated.statusCode).toBe(200)
      expect(updated.json().data).toMatchObject({ bid_price: 110, ask_price: 111 })
    })

    it('never hard-fails after a burst of ERROR frames (metrics-counters-only alerting)', async () => {
      const setupsBefore = server.countByType('SETUP')

      // Far beyond any plausible failure budget: the spec's owner decision
      // (degraded_stream_alerting = metrics_counters_only) forbids a hard
      // error or a reconnect loop on provider ERROR frames. The alerting is
      // log/metrics-only by spec, so the observable contract is that the
      // connection stays up and the stream keeps flowing.
      for (let i = 0; i < 30; i++) {
        server.push({ type: 'ERROR', channel: 1, message: `provider error (burst ${i})` })
        await testAdapter.clock?.tickAsync?.(100)
      }
      expect(server.countByType('SETUP')).toBe(setupsBefore)

      // The stream is still healthy after the burst: newer data is served.
      server.push(quoteFrame(quoteRecord('TSLA', 1760000004000, 120, 121, 1, 2)))
      await flushFrames(testAdapter)
      const updated = await testAdapter.request(quoteRequest)
      expect(updated.statusCode).toBe(200)
      expect(updated.json().data).toMatchObject({ bid_price: 120, ask_price: 121 })
    })
  })

  describe('reconnect', () => {
    it('after CHANNEL_CLOSED the adapter re-handshakes, re-subscribes, and serves the cached last value during the window', async () => {
      // Self-contained setup: refresh the subscription (a direct cache-hit
      // request also re-arms the framework's subscription TTL), then push +
      // drain a fresh newest quote and assert it is served BEFORE the channel
      // is closed.
      const refreshed = await testAdapter.request(quoteRequest)
      expect(refreshed.statusCode).toBe(200)
      server.push(quoteFrame(quoteRecord('TSLA', 1760000005000, 130, 131, 1, 2)))
      await flushFrames(testAdapter)
      const preClose = await testAdapter.request(quoteRequest)
      expect(preClose.statusCode).toBe(200)
      expect(preClose.json().data).toMatchObject({ bid_price: 130, ask_price: 131 })
      expect(preClose.json().timestamps?.providerIndicatedTimeUnixMs).toBe(1760000005000)

      // The reconnect replay must carry the newest record: the fresh
      // subscription gets the provider's current data, so the cached value
      // after the re-subscribe is deterministic (130/131).
      server.setFeedData('Quote', 'TSLA', [
        quoteFrame(quoteRecord('TSLA', 1760000005000, 130, 131, 1, 2)),
      ])

      const setupsBefore = server.countByType('SETUP')
      const addsBefore = server.added().length

      // dxLink closes the feed channel: the CHANNEL_CLOSED control frame
      // followed by the server dropping the socket (both endpoint
      // transports' connections — the assertion set is per (symbol, eventType),
      // not per connection).
      server.push({ type: 'CHANNEL_CLOSED', channel: 1 })
      server.closeAll()

      // The framework reconnects: a fresh control handshake runs and the
      // desired FEED_SUBSCRIPTION adds are re-sent (subscriptions.new = desired).
      const reconnected = await awaitWs(
        testAdapter,
        () => server.countByType('SETUP') > setupsBefore && server.added().length > addsBefore,
      )
      expect(reconnected).toBe(true)
      expect(server.added().some((s) => s.symbol === 'TSLA' && s.type === 'Quote')).toBe(true)

      // The SAME add set is received again after the forced reconnect: each
      // desired (symbol, eventType) pair was added exactly once on the first
      // connection (dedupe test above), so a second add proves the full
      // desired set — BOTH endpoints' subscriptions — was re-sent. That
      // includes the price endpoint's gated pair: Trade and TradeETH for the
      // :USLF24 ticker (owner decision tradeteth_subscription_policy =
      // match_reference).
      const addCount = (symbol: string, type: string): number =>
        server.added().filter((s) => s.symbol === symbol && s.type === type).length
      expect(addCount('TSLA', 'Quote')).toBeGreaterThanOrEqual(2)
      expect(addCount('AAPL:USLF24', 'Trade')).toBeGreaterThanOrEqual(2)
      expect(addCount('AAPL:USLF24', 'TradeETH')).toBeGreaterThanOrEqual(2)

      // Owner decision reconnect_cache_behavior = serve_cached_last_value:
      // a request during the reconnect + re-handshake window serves the last
      // value with its original provider timestamp — it does not error.
      const duringWindow = await testAdapter.request(quoteRequest)
      expect(duringWindow.statusCode).toBe(200)
      expect(duringWindow.json().data).toMatchObject({ bid_price: 130, ask_price: 131 })
      expect(duringWindow.json().timestamps?.providerIndicatedTimeUnixMs).toBe(1760000005000)

      // The stream resumes on the new connection: a newer frame is served.
      server.push(quoteFrame(quoteRecord('TSLA', 1760000006000, 140, 141, 1, 2)))
      await flushFrames(testAdapter)
      const resumed = await testAdapter.request(quoteRequest)
      expect(resumed.statusCode).toBe(200)
      expect(resumed.json().data).toMatchObject({ bid_price: 140, ask_price: 141 })
      expect(resumed.json().timestamps?.providerIndicatedTimeUnixMs).toBe(1760000006000)
    })

    it('increments the framework wsConnectionClosures counter on the closure (metrics-counters-only alerting)', async () => {
      // A known good value is cached before the closure so the window check
      // below has something to serve.
      const before = await testAdapter.request(quoteRequest)
      expect(before.statusCode).toBe(200)

      // Owner decision degraded_stream_alerting = metrics_counters_only: the
      // observable alerting surface for a dropped connection is the
      // framework's own wsConnectionClosures counter (labels code/url) — no
      // adapter error path. Sum the counter's labelled series; only the delta
      // matters, so pre-existing series from earlier tests are irrelevant.
      const closuresCounter = metrics.get('wsConnectionClosures')
      const closureCount = async (): Promise<number> =>
        (await closuresCounter.get()).values.reduce((total, v) => total + v.value, 0)

      const setupsBefore = server.countByType('SETUP')
      const closuresBefore = await closureCount()

      server.push({ type: 'CHANNEL_CLOSED', channel: 1 })
      server.closeAll()

      // The fresh SETUP proves the close handler ran and the reconnect began.
      const reconnected = await awaitWs(
        testAdapter,
        () => server.countByType('SETUP') > setupsBefore,
      )
      expect(reconnected).toBe(true)
      expect(await closureCount()).toBeGreaterThan(closuresBefore)

      // The adapter itself raises no error: the cached last value is served
      // while the reconnect window is open.
      const duringWindow = await testAdapter.request(quoteRequest)
      expect(duringWindow.statusCode).toBe(200)
      expect(duringWindow.json().data).toMatchObject({ bid_price: 130, ask_price: 131 })
    })

    it('closes the socket on CHANNEL_CLOSED when the server keeps it open', async () => {
      // Keep this last in the describe: the reconnect replays the canned frames.
      const setupsBefore = server.countByType('SETUP')
      const addsBefore = server.added().length

      // Only the control frame; the server does NOT drop the socket.
      server.push({ type: 'CHANNEL_CLOSED', channel: 1 })

      const reconnected = await awaitWs(
        testAdapter,
        () => server.countByType('SETUP') > setupsBefore && server.added().length > addsBefore,
      )
      expect(reconnected).toBe(true)
      expect(server.added().some((s) => s.symbol === 'TSLA' && s.type === 'Quote')).toBe(true)
    })
  })

  describe('open gate', () => {
    it('rejects the open handshake when FEED_CONFIG never arrives, then recovers', async () => {
      const gateRequest = { base: 'GATE', quote: 'USD', endpoint: 'stock_quotes' }

      server.suppressFeedConfig = true
      server.closeAll()

      // The adapter reconnects and re-runs the handshake, but open must not
      // resolve without FEED_CONFIG; retries stay inside WS_CONNECTION_OPEN_TIMEOUT.
      const reconnected = await awaitWs(testAdapter, () => server.countByType('SETUP') >= 2)
      expect(reconnected).toBe(true)
      const addsWhileSuppressed = server.added().length
      await testAdapter.clock?.tickAsync?.(6000)
      expect(server.countByType('SETUP')).toBeGreaterThanOrEqual(3)
      // Nothing may subscribe before FEED_CONFIG arrives.
      expect(server.added().length).toBe(addsWhileSuppressed)

      const gated = await testAdapter.request(gateRequest)
      expect(gated.statusCode).not.toBe(200)

      server.suppressFeedConfig = false
      const setupsBeforeRecovery = server.countByType('SETUP')
      server.closeAll()
      await awaitWs(testAdapter, () => server.countByType('SETUP') > setupsBeforeRecovery)
      const recovered = await testAdapter.request(gateRequest)
      expect(recovered.statusCode).toBe(200)
      expect(recovered.json().data).toMatchObject({ bid_price: 120, ask_price: 121 })
      expect(recovered.json().timestamps?.providerIndicatedTimeUnixMs).toBe(1760000002000)
    })
  })

  describe('stale subscription expiry', () => {
    // Runs LAST on purpose: it advances the fake clock past
    // WS_SUBSCRIPTION_TTL, which expires (and unsubscribes) every other
    // test's subscriptions too — nothing after this test depends on them.
    it('sends FEED_SUBSCRIPTION remove arrays when subscriptions go stale', async () => {
      const removeRequest = { base: 'REMOVE:USLF24', quote: 'USD', endpoint: 'stock_quotes' }
      const response = await testAdapter.request(removeRequest)
      expect(response.statusCode).toBe(200)

      // WS_SUBSCRIPTION_TTL (60000) after the last request for the params,
      // the framework's subscription set expires the entry and the stream
      // loop unsubscribes it. Other subscriptions may expire in the same
      // drain window, so the remove message is asserted to CONTAIN the stale
      // entry, not to equal a singleton list.
      const removed = await awaitWs(
        testAdapter,
        () => server.removed().some((s) => s.symbol === 'REMOVE:USLF24' && s.type === 'Quote'),
        70000,
      )
      expect(removed).toBe(true)
      const removeMessage = server.clientMessages.filter(
        (m) =>
          m.type === 'FEED_SUBSCRIPTION' &&
          (m.remove ?? []).some(
            (s: { symbol: string; type: string }) => s.symbol === 'REMOVE:USLF24',
          ),
      )[0]
      expect(removeMessage).toMatchObject({ channel: 1 })
      expect(removeMessage.remove).toEqual(
        expect.arrayContaining([{ symbol: 'REMOVE:USLF24', type: 'Quote' }]),
      )
    })
  })
})
