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
  })

  describe('reconnect', () => {
    it('serves the cached last value with its original timestamp during the reconnect window, then the fresh value after the re-handshake', async () => {
      // Provider drops the connection; the adapter must not error while it
      // reconnects and re-handshakes (owner decision reconnect_cache_behavior
      // = serve_cached_last_value). Each endpoint's ws transport holds its own
      // dxLink connection; drop the stock_quotes one so its reconnect is what
      // this test observes.
      dxLinkConnections[0]?.close()
      await step()

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
  })
})
