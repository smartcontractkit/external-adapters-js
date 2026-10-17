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
  setFeedData,
  setFeedDataRecords,
} from './dxlink-mocks'

// Captured before FakeTimers.install() replaces the global timers: the mock
// socket bridge delivers frames on a REAL timer, so every step yields fake
// time (background cycles) AND real time (frame delivery).
const realSetTimeout = setTimeout

const WS_URL = 'ws://localhost:9104/dxlink-chainlink'

// The spec stock_quotes sample_response's verbatim FEED_DATA frame: ONE COMPACT
// row concatenating TWO Quote records for AAPL:USLF24. The spec's golden
// example response (endpoint_request_response_examples.stock_quotes) derives
// from the newest (second) record: bid 189.90/50, ask 190.10/80, time
// 1760000001000.
setFeedDataRecords('Quote', 'AAPL:USLF24', [
  ['Quote', 'AAPL:USLF24', 1760000000000, 189.95, 190.05, 100, 200, 'V', 'V'],
  ['Quote', 'AAPL:USLF24', 1760000001000, 189.9, 190.1, 50, 80, 'O', 'O'],
])

// requireVolume flow: prices valid, both volumes the JSON string "NaN"
// (spec valueRangeScalingNotes: "NaN" marks the value invalid)
setFeedData('Quote', 'NVOL:USLF24', [
  'Quote',
  'NVOL:USLF24',
  1760000003000,
  189.95,
  190.05,
  'NaN',
  'NaN',
  'V',
  'V',
])

// isOvernight flow: the same book quoted on a non-overnight venue (V) and on
// the overnight venue (O, Blue Ocean) on BOTH sides
setFeedData('Quote', 'NVCE:USLF24', [
  'Quote',
  'NVCE:USLF24',
  1760000006000,
  100,
  101,
  10,
  11,
  'V',
  'V',
])
setFeedData('Quote', 'OOCE:USLF24', [
  'Quote',
  'OOCE:USLF24',
  1760000005000,
  100,
  101,
  10,
  11,
  'O',
  'O',
])

// price flow: Trade (regular hours) and TradeETH (extended hours) for the same
// symbol; the spec price endpoint serves the record with the newest time
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

// Bare-ticker flow: a ticker with no :USLF24 suffix and no override
setFeedData('Trade', 'BARE', [
  'Trade',
  'BARE',
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

// Stale-serving flow: a symbol whose stream goes quiet after its one quote
// (owner decision stale_quote_serving = serve_last_value_with_timestamp)
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

// Reconnect flow: a symbol whose quote the re-subscription picks up after the
// re-handshake (owner decision reconnect_cache_behavior = serve_cached_last_value)
setFeedData('Quote', 'RECONN:USLF24', [
  'Quote',
  'RECONN:USLF24',
  1760000070000,
  10.0,
  11.0,
  1,
  2,
  'V',
  'V',
])

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

describe('execute', () => {
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

  // The request must stay unserved (504) across several background cycles
  const requestStaysUnavailable = async (params: Record<string, unknown>): Promise<number[]> => {
    const statusCodes: number[] = []
    let response = await testAdapter.request(params)
    for (let i = 0; i < 5; i++) {
      await step()
      statusCodes.push(response.statusCode)
      response = await testAdapter.request(params)
    }
    statusCodes.push(response.statusCode)
    return statusCodes
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

    // Warm the cache for the spec golden example flow
    await requestUntilCached(quoteRequest, 1760000001000)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('stock_quotes', () => {
    it('serves the spec example response', async () => {
      // Spec endpoint_request_response_examples (stock_quotes): mid 190.0 over
      // bid 189.90 / ask 190.10, volumes 50/80, providerIndicatedTimeUnixMs
      // 1760000001000 — the freshest record of the spec's own two-record
      // sample_response frame
      const response = await testAdapter.request(quoteRequest)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchObject({
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
      })
    })

    it('errors on invalid volumes when requireVolume=true', async () => {
      // Spec stock_quotes: "requireVolume errors on invalid volumes" — the
      // JSON string "NaN" volumes surface as an error result, never a zero
      const response = await requestUntilCached({
        endpoint: 'stock_quotes',
        from: 'NVOL',
        to: 'USD',
        requireVolume: true,
        overrides: {
          dxfeed: {
            NVOL: 'NVOL:USLF24',
          },
        },
      })
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchObject({
        errorMessage: expect.anything(),
        // providerIndicatedTimeUnixMs is a downstream report field on every
        // result (spec intake.purposeHowUsed): the failed record's own Quote
        // time rides the 502
        timestamps: { providerIndicatedTimeUnixMs: 1760000003000 },
      })
    })

    it('rejects a Quote whose exchange codes are not O on both sides when isOvernight=true', async () => {
      // Spec stock_quotes: "isOvernight accepts only exchange code O on both
      // sides (Blue Ocean)" — the V/V record is dropped, nothing is served
      const statusCodes = await requestStaysUnavailable({
        endpoint: 'stock_quotes',
        from: 'NVCE',
        to: 'USD',
        isOvernight: true,
        overrides: {
          dxfeed: {
            NVCE: 'NVCE:USLF24',
          },
        },
      })
      expect(statusCodes.length).toBeGreaterThan(0)
      expect(new Set(statusCodes)).toEqual(new Set([504]))
    })

    it('accepts a Quote with exchange code O on both sides when isOvernight=true', async () => {
      // The isOvernight accept path: the O/O (Blue Ocean) record is served.
      // The parameter's absence must also be tolerated (spec: 74 Overnight
      // streams omit it) — every other flow in this suite runs without it.
      const response = await requestUntilCached({
        endpoint: 'stock_quotes',
        from: 'OOCE',
        to: 'USD',
        isOvernight: true,
        overrides: {
          dxfeed: {
            OOCE: 'OOCE:USLF24',
          },
        },
      })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchObject({
        data: {
          mid_price: 100.5,
          bid_price: 100,
          bid_volume: 10,
          ask_price: 101,
          ask_volume: 11,
        },
        result: 100.5,
        timestamps: {
          providerIndicatedTimeUnixMs: 1760000005000,
        },
      })
    })

    it('serves the last value with its original provider timestamp after the stream goes quiet', async () => {
      // Owner decision stale_quote_serving = serve_last_value_with_timestamp:
      // markets close, the Quote stream goes quiet, and the last value keeps
      // flowing with its ORIGINAL provider timestamp — no max-age rejection,
      // no error envelope (the staleness guard reports through metrics only)
      const warmed = await requestUntilCached({
        endpoint: 'stock_quotes',
        from: 'QUIET',
        to: 'USD',
        overrides: {
          dxfeed: {
            QUIET: 'QUIET:USLF24',
          },
        },
      })
      expect(warmed.statusCode).toBe(200)
      expect(warmed.json()).toMatchObject({
        result: 50.1,
        timestamps: { providerIndicatedTimeUnixMs: 1760000002000 },
      })

      // Several background cycles run with no frames pushed and no requests
      for (let i = 0; i < 5; i++) {
        await step()
      }

      const stale = await testAdapter.request({
        endpoint: 'stock_quotes',
        from: 'QUIET',
        to: 'USD',
        overrides: {
          dxfeed: {
            QUIET: 'QUIET:USLF24',
          },
        },
      })
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

  describe('price', () => {
    it('serves the newest-time record when Trade and TradeETH both arrive for the symbol', async () => {
      // Spec price endpoint: "Subscribe BOTH event types for every symbol; when
      // both arrive serve the record with the newest time", and
      // response_mapping.provider_timestamp = time. The mock server only pushes
      // a TradeETH frame when the wire FEED_SUBSCRIPTION add carries the
      // TradeETH entry, so receiving one at all proves the dual subscription
      // went out on the single dxLink connection.
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

    it('subscribes Trade only for a bare-ticker request (no :USLF24 suffix)', async () => {
      // Owner decision tradeteth_subscription_policy = match_reference: the
      // TradeETH subscription is gated on the :USLF24 ticker suffix — a bare
      // ticker subscribes the Trade entry only. The FEED_SUBSCRIPTION add
      // frames the adapter actually put on the dxLink wire are the proof.
      const response = await requestUntilCached(
        { endpoint: 'price', base: 'BARE', to: 'USD', transport: 'ws' },
        1760000008000,
      )
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchObject({
        result: 187.25,
        timestamps: { providerIndicatedTimeUnixMs: 1760000008000 },
      })

      const subscriptionAdds = clientFrameLog
        .flat()
        .map((raw) => {
          try {
            return JSON.parse(raw)
          } catch {
            return undefined
          }
        })
        .filter((m: any) => m?.type === 'FEED_SUBSCRIPTION')
        .flatMap((m: any) => m.add ?? [])
      expect(subscriptionAdds).toContainEqual({ symbol: 'BARE', type: 'Trade' })
      expect(subscriptionAdds).not.toContainEqual({ symbol: 'BARE', type: 'TradeETH' })
    })
  })

  describe('reconnect cache behavior', () => {
    // Connections closed by earlier reconnect rounds of this test; the array
    // only grows (the framework re-registers each re-established connection),
    // so closing is indexed to avoid closing an already-closed socket twice
    let closedCount = 0
    const closeOpenConnections = () => {
      for (let i = closedCount; i < dxLinkConnections.length; i++) {
        dxLinkConnections[i]?.close()
      }
      closedCount = dxLinkConnections.length
    }

    const reconnRequest = {
      endpoint: 'stock_quotes',
      from: 'RECONN',
      to: 'USD',
      overrides: {
        dxfeed: {
          RECONN: 'RECONN:USLF24',
        },
      },
    }

    it('serves the cached last value during the reconnect window, then the fresh value after the re-handshake', async () => {
      // Owner decision reconnect_cache_behavior = serve_cached_last_value:
      // dropping the dxLink connection forces the framework's reconnect +
      // re-handshake (open gate) + resubscribe cycle, and a request arriving
      // during that window returns the cached last value with its ORIGINAL
      // provider timestamp, statusCode 200, and no error envelope
      const warmed = await requestUntilCached(reconnRequest, 1760000070000)
      expect(warmed.statusCode).toBe(200)
      expect(warmed.json()).toMatchObject({
        data: {
          mid_price: 10.5,
          bid_price: 10.0,
          bid_volume: 1,
          ask_price: 11.0,
          ask_volume: 2,
        },
        result: 10.5,
        timestamps: { providerIndicatedTimeUnixMs: 1760000070000 },
      })

      // Drop every open connection (both endpoint transports share the mock
      // server) and wait for the framework to register a re-established one
      const connectionsBefore = dxLinkConnections.length
      closeOpenConnections()
      for (let i = 0; i < 20 && dxLinkConnections.length <= connectionsBefore; i++) {
        await step()
      }
      expect(dxLinkConnections.length).toBeGreaterThan(connectionsBefore)

      // The reconnect-window request: the cached value, original timestamp
      const duringReconnect = await testAdapter.request(reconnRequest)
      expect(duringReconnect.statusCode).toBe(200)
      expect(duringReconnect.json()).toMatchObject({
        data: {
          mid_price: 10.5,
          bid_price: 10.0,
          bid_volume: 1,
          ask_price: 11.0,
          ask_volume: 2,
        },
        result: 10.5,
        timestamps: { providerIndicatedTimeUnixMs: 1760000070000 },
      })
      expect(duringReconnect.json().errorMessage).toBeUndefined()

      // The quote the re-subscription receives after the NEXT re-handshake:
      // the mock server re-delivers the currently registered frame on each
      // FEED_SUBSCRIPTION re-add, so register the fresh quote, then drop the
      // re-established connection to make the resubscription pick it up
      setFeedData('Quote', 'RECONN:USLF24', [
        'Quote',
        'RECONN:USLF24',
        1760000080000,
        20.0,
        21.0,
        3,
        4,
        'V',
        'V',
      ])
      closeOpenConnections()

      const afterReconnect = await requestUntilCached(reconnRequest, 1760000080000)
      expect(afterReconnect.statusCode).toBe(200)
      expect(afterReconnect.json()).toMatchObject({
        data: {
          mid_price: 20.5,
          bid_price: 20.0,
          bid_volume: 3,
          ask_price: 21.0,
          ask_volume: 4,
        },
        result: 20.5,
        timestamps: { providerIndicatedTimeUnixMs: 1760000080000 },
      })
    })
  })
})
