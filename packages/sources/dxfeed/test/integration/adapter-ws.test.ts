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
  dxLinkConnections,
  mockDxLinkServer,
  setFeedData,
  setFeedDataRecords,
} from './dxlink-mocks'

// Captured before FakeTimers.install() replaces the global timers: the mock
// socket bridge delivers frames on a REAL timer, so every step yields fake
// time (background cycles) AND real time (frame delivery), then polls.
const realSetTimeout = setTimeout

const WS_URL = 'ws://localhost:9090/dxlink-chainlink'

// Spec endpoint_request_response_examples (OPDATA-9200)
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

const priceRequest = {
  endpoint: 'stock',
  from: 'AAPL',
  to: 'USD',
  transport: 'ws',
  overrides: {
    dxfeed: {
      AAPL: 'AAPL:USLF24',
    },
  },
}

describe('dxLink websocket smoke flows', () => {
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
    // support: the URL is injected through WS_API_ENDPOINT only — the spec
    // declares no extra env var for it
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

    // Warm the cache for both endpoints sharing the single dxLink connection
    await requestUntilCached(quoteRequest)
    await requestUntilCached(priceRequest)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('stock_quotes (Quote events)', () => {
    it('serves the spec example response', async () => {
      const response = await testAdapter.request(quoteRequest)
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
    })

    it('surfaces the spec sample "NaN" quote as an error result', async () => {
      // Spec stock_quotes sample_response, second FEED_DATA frame: the JSON
      // string "NaN" marks a value invalid (valueRangeScalingNotes) — the
      // adapter must reject the record, not serve NaN as a price.
      const response = await requestUntilCached({
        endpoint: 'stock_quotes',
        from: 'BADQ',
        to: 'USD',
        overrides: {
          dxfeed: {
            BADQ: 'BADQ:USLF24',
          },
        },
      })
      expect(response.statusCode).toBe(502)
      // Stream error results ride the response cache, so the error body carries
      // a top-level errorMessage (not the thrown-error { error } envelope)
      expect(response.json()).toMatchObject({
        errorMessage: expect.anything(),
        // timestamps.providerIndicatedTimeUnixMs is a downstream report field on
        // EVERY result (spec intake.purposeHowUsed): the failed record's own
        // Quote time must ride the 502 so freshness reporting keeps a provider
        // timestamp
        timestamps: { providerIndicatedTimeUnixMs: 1760000002000 },
      })
    })

    it('ignores a server KEEPALIVE frame: no result, stream untouched', async () => {
      // Spec keepalive.interval_seconds=30 cuts both ways: the server also sends
      // KEEPALIVE control frames on the connection. A KEEPALIVE must produce no
      // result and leave the subscription stream untouched — the last value
      // keeps serving with its original timestamp.
      // The quote endpoint's connection is the first the adapter opened
      const quoteConnection = dxLinkConnections[0]
      expect(quoteConnection).toBeDefined()
      quoteConnection?.send(JSON.stringify({ type: 'KEEPALIVE', channel: 0 }))
      await step()

      const response = await testAdapter.request(quoteRequest)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchObject({
        result: 190.0,
        timestamps: { providerIndicatedTimeUnixMs: 1760000000000 },
      })
    })
  })

  describe('reconnect', () => {
    it('serves the cached last value with its original timestamp during the reconnect window, then the fresh value after the re-handshake', async () => {
      // Provider drops the connection; the adapter must not error while it
      // reconnects and re-handshakes (owner decision reconnect_cache_behavior
      // = serve_cached_last_value). Each endpoint's ws transport holds its own
      // dxLink connection; drop the stock_quotes one so its reconnect is what
      // this test observes.
      const connectionsBefore = dxLinkConnections.length
      dxLinkConnections[0]?.close()
      // Wait for the re-established quote connection to be registered, so the
      // second drop below targets the quote session's fresh connection rather
      // than racing onto the price endpoint's connection
      for (let i = 0; i < 20 && dxLinkConnections.length <= connectionsBefore; i++) {
        await step()
      }
      expect(dxLinkConnections.length).toBeGreaterThan(connectionsBefore)

      const duringReconnect = await testAdapter.request(quoteRequest)
      expect(duringReconnect.statusCode).toBe(200)
      expect(duringReconnect.json()).toMatchObject({
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
  })

  describe('price (Trade events, ws transport)', () => {
    it('serves the spec example response over the ws transport', async () => {
      const response = await testAdapter.request(priceRequest)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchObject({
        data: {
          result: 189.98,
        },
        result: 189.98,
        timestamps: {
          providerIndicatedTimeUnixMs: 1760000000000,
        },
      })
    })

    it('resolves the endpoint aliases to price', async () => {
      const response = await requestUntilCached({ ...priceRequest, endpoint: 'crypto' })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchObject({
        result: 189.98,
        timestamps: {
          providerIndicatedTimeUnixMs: 1760000000000,
        },
      })
    })

    it('serves the newest-time record when Trade and TradeETH both arrive for the symbol', async () => {
      // Spec price endpoint: "Subscribe BOTH event types for every symbol; when
      // both arrive serve the record with the newest time", and
      // response_mapping.provider_timestamp = time. The mock server only pushes
      // a TradeETH frame when the wire FEED_SUBSCRIPTION add carries the
      // TradeETH entry, so receiving one at all proves the dual subscription
      // went out on the single dxLink connection.
      setFeedData('Trade', 'TSM:USLF24', [
        'Trade',
        'TSM:USLF24',
        1760000000000,
        100,
        10,
        12345,
        'V',
        0.12,
        5000000,
        999000000,
        'UP',
        false,
      ])
      setFeedData('TradeETH', 'TSM:USLF24', [
        'TradeETH',
        'TSM:USLF24',
        1760000005000,
        101.5,
        10,
        12346,
        'V',
        0.15,
        5100000,
        1005000000,
        'UP',
        false,
      ])

      const response = await requestUntilCached(
        {
          endpoint: 'price',
          base: 'TSM',
          to: 'USD',
          transport: 'ws',
          overrides: {
            dxfeed: {
              TSM: 'TSM:USLF24',
            },
          },
        },
        1760000005000,
      )
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchObject({
        data: { result: 101.5 },
        result: 101.5,
        timestamps: {
          providerIndicatedTimeUnixMs: 1760000005000,
        },
      })
    })

    it('serves the newest-time record when ONE COMPACT frame concatenates two Trade records for the symbol', async () => {
      // Plan round-2 item 2: with acceptAggregationPeriod=1 the provider batches
      // several Trade records into one COMPACT FEED_DATA frame, and every record
      // in the frame must be processed — the spec price rule ("serve the record
      // with the newest time") then serves the LATER record of the ascending-time
      // pair, not the first one in the frame.
      setFeedDataRecords('Trade', 'TWO:USLF24', [
        [
          'Trade',
          'TWO:USLF24',
          1760000000000,
          100.0,
          10,
          12345,
          'V',
          0.12,
          5000000,
          999000000,
          'UP',
          false,
        ],
        [
          'Trade',
          'TWO:USLF24',
          1760000001000,
          100.5,
          10,
          12346,
          'V',
          0.13,
          5000001,
          999000001,
          'UP',
          false,
        ],
      ])

      const response = await requestUntilCached(
        {
          endpoint: 'price',
          base: 'TWO',
          to: 'USD',
          transport: 'ws',
          overrides: {
            dxfeed: {
              TWO: 'TWO:USLF24',
            },
          },
        },
        1760000001000,
      )
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchObject({
        data: { result: 100.5 },
        result: 100.5,
        timestamps: {
          providerIndicatedTimeUnixMs: 1760000001000,
        },
      })
    })

    it('serves the Trade price when the Trade is newer than the TradeETH record', async () => {
      // Spec price endpoint: "when both arrive serve the record with the newest
      // time" — the mirror of the TSM case above: the regular-hours Trade is
      // the newer record and must win over the extended-hours TradeETH.
      setFeedData('TradeETH', 'TRD:USLF24', [
        'TradeETH',
        'TRD:USLF24',
        1760000000000,
        90.0,
        10,
        12345,
        'V',
        0.1,
        5000000,
        999000000,
        'UP',
        false,
      ])
      setFeedData('Trade', 'TRD:USLF24', [
        'Trade',
        'TRD:USLF24',
        1760000006000,
        90.5,
        10,
        12346,
        'V',
        0.11,
        5010000,
        1000000000,
        'UP',
        false,
      ])

      const response = await requestUntilCached(
        {
          endpoint: 'price',
          base: 'TRD',
          to: 'USD',
          transport: 'ws',
          overrides: {
            dxfeed: {
              TRD: 'TRD:USLF24',
            },
          },
        },
        1760000006000,
      )
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchObject({
        data: { result: 90.5 },
        result: 90.5,
        timestamps: {
          providerIndicatedTimeUnixMs: 1760000006000,
        },
      })
    })
  })

  describe('transport routing: transport="ws" routes to the dxLink socket', () => {
    it('serves a Trade price from the mock dxLink socket when transport="ws"', async () => {
      // Bare ticker, no override: the price ws transport subscribes the Trade
      // entry for the uppercased base as given. No REST interceptor exists for
      // WSRT, so the served value proves the ws transport handled the request.
      setFeedData('Trade', 'WSRT', [
        'Trade',
        'WSRT',
        1760000008000,
        187.25,
        10,
        12345,
        'V',
        0.12,
        5000000,
        999000000,
        'UP',
        false,
      ])

      const response = await requestUntilCached(
        { endpoint: 'stock', from: 'WSRT', to: 'USD', transport: 'ws' },
        1760000008000,
      )
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchObject({
        data: { result: 187.25 },
        result: 187.25,
        timestamps: {
          providerIndicatedTimeUnixMs: 1760000008000,
        },
      })
    })

    // The complementary half of the routing pair — the same request WITHOUT a
    // transport param is served by the defaultTransport "rest" REST fixture —
    // is asserted in price-http.test.ts (the REST request path runs on real
    // timers, outside this file's fake clock).
  })
})
