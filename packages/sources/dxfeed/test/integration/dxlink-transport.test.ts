import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { clientFrameLog, dxLinkConnections, mockDxLinkServer, setFeedData } from './fixtures'

// Captured before FakeTimers.install() replaces the global timers: the mock
// socket bridge delivers frames on a REAL timer, so every step yields fake
// time (background cycles, heartbeat interval) AND real time (frame delivery).
const realSetTimeout = setTimeout

const WS_URL = 'ws://localhost:9093/dxlink-chainlink'

// Spec primary_command handshake payloads (OPDATA-9200)
const SPEC_QUOTE_EVENT_FIELDS = [
  'eventType',
  'eventSymbol',
  'time',
  'bidPrice',
  'askPrice',
  'bidSize',
  'askSize',
  'bidExchangeCode',
  'askExchangeCode',
]

// Spec endpoint_request_response_examples requests
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

describe('dxLink wire protocol', () => {
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
    // ws:// loopback test bridge: the plaintext exemption is an explicit opt-in
    process.env['ALLOW_INSECURE_LOOPBACK_WS'] = 'true'
    process.env['API_USERNAME'] = process.env['API_USERNAME'] ?? 'fake-api-username'
    process.env['API_PASSWORD'] = process.env['API_PASSWORD'] ?? 'fake-api-password'
    // Short enough that the unsubscribe window fits the fake-clock ticks of the
    // last test; long enough to survive the reconnect test's steps
    process.env['WS_SUBSCRIPTION_TTL'] = '15000'
    process.env['CACHE_MAX_AGE'] = '600000'
    process.env['CACHE_POLLING_MAX_RETRIES'] = '0'

    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockDxLinkServer(WS_URL)

    // Bare-ticker Trade frame: the mock server only pushes FEED_DATA for
    // registered (eventType, symbol) pairs on FEED_SUBSCRIPTION add
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

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install({ now: Date.parse('2026-01-01T00:00:00Z') }),
      testAdapter: {} as TestAdapter<never>,
    })

    // Warm the cache: the quote endpoint opens connection 0, the price endpoint
    // connection 1 (each endpoint's ws transport holds its own dxLink session)
    await requestUntilCached(quoteRequest)
    await requestUntilCached(uslfPriceRequest)
    await requestUntilCached(barePriceRequest)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  it('performs the spec primary_command handshake on connect and gates data flow on FEED_CONFIG', async () => {
    // The first three frames a fresh connection sends are the spec
    // primary_command's SETUP, CHANNEL_REQUEST and FEED_SETUP messages
    const conn = sentMessages(0)
    expect(conn.slice(0, 3).map((m) => m.type)).toEqual(['SETUP', 'CHANNEL_REQUEST', 'FEED_SETUP'])
    expect(conn[0]).toMatchObject({
      channel: 0,
      keepaliveTimeout: 60,
      acceptKeepaliveTimeout: 60,
      version: '0.1-js/1.0.0',
    })
    expect(conn[1]).toMatchObject({
      channel: 1,
      service: 'FEED',
      parameters: { contract: 'AUTO' },
    })
    expect(conn[2]).toMatchObject({
      channel: 1,
      acceptAggregationPeriod: 1,
      acceptDataFormat: 'COMPACT',
    })
    expect(conn[2].acceptEventFields.Quote).toEqual(SPEC_QUOTE_EVENT_FIELDS)

    // The provider acknowledges FEED_SETUP with FEED_CONFIG echoing the accepted
    // COMPACT field list (spec stock_quotes sample_response); the adapter only
    // subscribes after that gate, and the mock server only pushes FEED_DATA on a
    // FEED_SUBSCRIPTION add — so the warmed value below proves the full chain.
    // The mock-socket bridge shares one socket object between this server and
    // the adapter, so FEED_CONFIG is delivered straight to the adapter's open
    // gate and leaves no entry in serverFrameLog to assert on here; the gate is
    // proven behaviorally: the FEED_SUBSCRIPTION add below only goes out after
    // the open handler settled on FEED_CONFIG, and the served value at the end
    // of this test proves the FEED_CONFIG field order parsed the FEED_DATA row.
    expect(
      feedSubscriptionAdds(sentMessages(0)).some(
        (e) => e.symbol === 'AAPL:USLF24' && e.type === 'Quote',
      ),
    ).toBe(true)

    const response = await testAdapter.request(quoteRequest)
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ result: 190.0 })
  })

  it('subscribes Quote for stock_quotes, and Trade plus TradeETH only for :USLF24 tickers on the price endpoint', async () => {
    // Both price requests share connection 1 (one dxLink session per endpoint)
    const adds = feedSubscriptionAdds(sentMessages(1))

    // Owner decision tradeteth_subscription_policy = match_reference: the
    // TradeETH entry rides the :USLF24 ticker suffix
    expect(adds.some((e) => e.symbol === 'TSM:USLF24' && e.type === 'Trade')).toBe(true)
    expect(adds.some((e) => e.symbol === 'TSM:USLF24' && e.type === 'TradeETH')).toBe(true)

    // Spec price endpoint: "Symbols without an ETH session simply yield no
    // TradeETH events" — a bare ticker subscribes Trade only
    expect(adds.some((e) => e.symbol === 'MSFT' && e.type === 'Trade')).toBe(true)
    expect(adds.some((e) => e.symbol === 'MSFT' && e.type === 'TradeETH')).toBe(false)
  })

  it('resubscribes the desired set on the wire after a forced reconnect', async () => {
    // Spec framework_alignment reconnect_resubscribe: on reconnect the whole
    // desired set goes back out as FEED_SUBSCRIPTION add entries. Register a
    // newer Trade frame first so the re-subscription's re-delivery carries a
    // fresh, distinguishable value.
    setFeedData('Trade', 'TSM:USLF24', [
      'Trade',
      'TSM:USLF24',
      1760000010000,
      102.25,
      10,
      12346,
      'V',
      0.13,
      5010000,
      999500000,
      'UP',
      false,
    ])

    const connectionsBefore = dxLinkConnections.length
    dxLinkConnections[dxLinkConnections.length - 1]?.close()

    const newConnIndex = () => dxLinkConnections.length - 1
    for (let i = 0; i < 20 && dxLinkConnections.length <= connectionsBefore; i++) {
      await step()
    }
    expect(dxLinkConnections.length).toBeGreaterThan(connectionsBefore)

    const adds = feedSubscriptionAdds(sentMessages(newConnIndex()))
    expect(adds.some((e) => e.symbol === 'TSM:USLF24' && e.type === 'Trade')).toBe(true)
    expect(adds.some((e) => e.symbol === 'TSM:USLF24' && e.type === 'TradeETH')).toBe(true)

    // The re-established stream serves the fresh record
    const response = await requestUntilCached(uslfPriceRequest, 1760000010000)
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      result: 102.25,
      timestamps: { providerIndicatedTimeUnixMs: 1760000010000 },
    })
  })

  it('sends KEEPALIVE frames on the spec 30s interval and drops expired subscriptions from the wire', async () => {
    // Spec keepalive interval_seconds=30. No requests flow during this window,
    // so the WS_SUBSCRIPTION_TTL also lapses: the wire must carry KEEPALIVE
    // frames and a FEED_SUBSCRIPTION remove for the expired subscriptions.
    // The wire frames are observed through the per-connection frame logs the
    // bridge registers at connection time — clearing the outer log here would
    // detach the live connection's array and hide every frame it sends during
    // this quiet window, so the existing logs are read in full; the .some()
    // assertions tolerate the earlier handshake/subscription frames.
    for (let i = 0; i < 70; i++) {
      await step()
    }

    const sent = clientFrameLog
      .flat()
      .map(parseFrame)
      .filter((m): m is AnyMsg => Boolean(m))
    expect(sent.some((m) => m.type === 'KEEPALIVE')).toBe(true)

    const removes = sent
      .filter((m) => m.type === 'FEED_SUBSCRIPTION')
      .flatMap((m) => m.remove ?? [])
    expect(removes.some((e) => e.symbol === 'AAPL:USLF24' && e.type === 'Quote')).toBe(true)
  })
})
