import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { clientFrameLog, dxLinkConnections, mockDxLinkServer, setFeedData } from './dxlink-mocks'

// Captured before FakeTimers.install() replaces the global timers: the mock
// socket bridge delivers frames on a REAL timer, so every step yields fake
// time (background cycles, subscription TTL) AND real time (frame delivery).
const realSetTimeout = setTimeout

const WS_URL = 'ws://localhost:9106/dxlink-chainlink'

// Spec endpoint_request_response_examples requests (OPDATA-9200)
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

const bareQuoteRequest = {
  endpoint: 'stock_quotes',
  from: 'MSFT',
  to: 'USD',
}

const uslfPriceRequest = {
  endpoint: 'stock',
  from: 'TSM',
  to: 'USD',
  transport: 'ws',
  overrides: {
    dxfeed: {
      TSM: 'TSM:USLF24',
    },
  },
}

const barePriceRequest = {
  endpoint: 'price',
  base: 'MSFT',
  quote: 'USD',
  transport: 'ws',
}

type AnyMsg = Record<string, any>

const parseFrame = (raw: string): AnyMsg | undefined => {
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

const sentMessages = (conn: number): AnyMsg[] =>
  (clientFrameLog[conn] ?? []).map(parseFrame).filter((m): m is AnyMsg => Boolean(m))

const feedSubscriptionAdds = (msgs: AnyMsg[]): { symbol: string; type: string }[] =>
  msgs.filter((m) => m.type === 'FEED_SUBSCRIPTION').flatMap((m) => m.add ?? [])

const feedSubscriptionRemoves = (msgs: AnyMsg[]): { symbol: string; type: string }[] =>
  msgs.filter((m) => m.type === 'FEED_SUBSCRIPTION').flatMap((m) => m.remove ?? [])

describe('dxLink subscription fan-out (FEED_SUBSCRIPTION add/remove on the wire)', () => {
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
    // that admits the plaintext ws:// endpoint
    process.env['ALLOW_PLAINTEXT_WS_TEST'] = 'true'
    process.env['API_USERNAME'] = process.env['API_USERNAME'] ?? 'fake-api-username'
    process.env['API_PASSWORD'] = process.env['API_PASSWORD'] ?? 'fake-api-password'
    // Subscriptions expire 60s after their last refreshing request: the
    // unsubscribe test below drives one symbol past the TTL while keeping a
    // second one alive
    process.env['WS_SUBSCRIPTION_TTL'] = '60000'
    process.env['CACHE_MAX_AGE'] = '600000'
    process.env['CACHE_POLLING_MAX_RETRIES'] = '0'

    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockDxLinkServer(WS_URL)

    // The mock server only pushes FEED_DATA for registered (eventType, symbol)
    // pairs on a FEED_SUBSCRIPTION add — receiving a frame at all proves the
    // matching add went out on the wire.
    setFeedData('Quote', 'MSFT', ['Quote', 'MSFT', 1760000000000, 240.0, 240.2, 10, 20, 'V', 'V'])
    setFeedData('Trade', 'MSFT', [
      'Trade',
      'MSFT',
      1760000000000,
      240.5,
      10,
      12345,
      'V',
      0.12,
      5000000,
      999000000,
      'UP',
      false,
    ])
    setFeedData('Trade', 'TSM:USLF24', [
      'Trade',
      'TSM:USLF24',
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

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install({ now: Date.parse('2026-01-01T00:00:00Z') }),
      testAdapter: {} as TestAdapter<never>,
    })

    // Warm the cache. Warm order fixes the connection indexes: the stock_quotes
    // transport opens connection 0, the price transport connection 1 (each
    // endpoint's ws transport holds its own dxLink session).
    await requestUntilCached(quoteRequest)
    await requestUntilCached(uslfPriceRequest, 1760000005000)
    await requestUntilCached(barePriceRequest)
    await requestUntilCached(bareQuoteRequest)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  it('stock_quotes sends exactly one Quote add for the post-override symbol (no duplicate on re-request)', async () => {
    // Repeated requests and background cycles with an unchanged desired set
    // must not re-send the subscription: the wire carries exactly one
    // FEED_SUBSCRIPTION add entry per (symbol, eventType)
    const aaplQuoteAdds = feedSubscriptionAdds(sentMessages(0)).filter(
      (e) => e.symbol === 'AAPL:USLF24' && e.type === 'Quote',
    )
    expect(aaplQuoteAdds).toHaveLength(1)
  }, 30000)

  it('subscribes Trade and TradeETH for a :USLF24 ticker, and Trade only for a bare ticker', async () => {
    const adds = feedSubscriptionAdds(sentMessages(1))

    // Owner decision tradeteth_subscription_policy = match_reference: the
    // TradeETH entry rides the :USLF24 ticker suffix
    expect(adds.some((e) => e.symbol === 'TSM:USLF24' && e.type === 'Trade')).toBe(true)
    expect(adds.some((e) => e.symbol === 'TSM:USLF24' && e.type === 'TradeETH')).toBe(true)

    // Spec price endpoint: "Symbols without an ETH session simply yield no
    // TradeETH events" — a bare ticker subscribes Trade only
    expect(adds.some((e) => e.symbol === 'MSFT' && e.type === 'Trade')).toBe(true)
    expect(adds.some((e) => e.symbol === 'MSFT' && e.type === 'TradeETH')).toBe(false)
  }, 30000)

  it('sends the FEED_SUBSCRIPTION remove once a subscription expires (WS_SUBSCRIPTION_TTL) and keeps the still-desired one', async () => {
    // MSFT's quote subscription stops being refreshed; AAPL keeps re-requesting
    // (each request refreshes its own subscription TTL). After the 60s TTL the
    // next background cycle unsubscribes MSFT on the wire — but never AAPL.
    const baseline = clientFrameLog[0]?.length ?? 0
    for (let i = 0; i < 80; i++) {
      await step()
      if (i % 10 === 0) {
        await testAdapter.request(quoteRequest)
      }
      const windowFrames = (clientFrameLog[0] ?? [])
        .slice(baseline)
        .map(parseFrame)
        .filter((m): m is AnyMsg => Boolean(m))
      const removes = feedSubscriptionRemoves(windowFrames)
      if (removes.some((e) => e.symbol === 'MSFT' && e.type === 'Quote')) {
        // MSFT removed, AAPL never removed
        expect(removes.some((e) => e.symbol === 'AAPL:USLF24' && e.type === 'Quote')).toBe(false)
        return
      }
    }
    throw new Error('expected a FEED_SUBSCRIPTION remove for the expired MSFT Quote subscription')
  }, 40000)

  it('resubscribes the desired set on the wire after a forced reconnect', async () => {
    // Spec framework_alignment reconnect_resubscribe: on reconnect the whole
    // desired set goes back out as FEED_SUBSCRIPTION add entries. The desired
    // quote set is AAPL only (MSFT was unsubscribed by the TTL test above and
    // stays gone across the reconnect).
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

    const connectionsBefore = dxLinkConnections.length
    dxLinkConnections[0]?.close()
    for (let i = 0; i < 20 && dxLinkConnections.length <= connectionsBefore; i++) {
      await step()
    }
    expect(dxLinkConnections.length).toBeGreaterThan(connectionsBefore)

    const newConnIndex = dxLinkConnections.length - 1
    const adds = feedSubscriptionAdds(sentMessages(newConnIndex))
    expect(adds.some((e) => e.symbol === 'AAPL:USLF24' && e.type === 'Quote')).toBe(true)
    // The expired subscription is not resurrected by the reconnect
    expect(adds.some((e) => e.symbol === 'MSFT' && e.type === 'Quote')).toBe(false)

    // The re-established stream serves the fresh record on the real request path
    const response = await requestUntilCached(quoteRequest, 1760000010000)
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      result: 190.25,
      timestamps: { providerIndicatedTimeUnixMs: 1760000010000 },
    })
  }, 40000)
})
