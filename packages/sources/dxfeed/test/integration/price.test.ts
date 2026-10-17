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

const WS_URL = 'ws://localhost:9099/dxlink-chainlink'

// Spec price sample_response Trade record fields:
// eventType,eventSymbol,time,price,size,sequence,exchangeCode,change,
// dayVolume,dayTurnover,tickDirection,extendedTradingHours

// The Trade/TradeETH pair for the "newer TradeETH supersedes" flow
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

// The mirror pair: the Trade is the NEWER record, the TradeETH older. The mock
// server delivers the frames in the wire FEED_SUBSCRIPTION add order (Trade
// first, TradeETH second), so the older TradeETH arrives LAST and must NOT
// supersede the newer Trade.
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

// Spec endpoint_request_response_examples request (stock endpoint, ws transport)
const aaplRequest = {
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

const priceRequest = (endpoint: string, base: string) => ({
  endpoint,
  base,
  to: 'USD',
  transport: 'ws',
  overrides: {
    dxfeed: {
      [base]: `${base}:USLF24`,
    },
  },
})

describe('price endpoint on the dxLink transport (ws)', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  const step = async () => {
    await testAdapter.clock?.tickAsync(1000)
    await new Promise((resolve) => realSetTimeout(resolve, 10))
  }

  // WS subscription semantics: the first request subscribes and may 504 while
  // the bridge delivers the handshake + FEED_DATA frames; poll deterministically
  // until the cache holds the value at `untilTimestamp`
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

    await requestUntilCached(aaplRequest, 1760000000000)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  it('serves the spec stock endpoint example response', async () => {
    // Spec endpoint_request_response_examples (stock, transport ws): the Trade
    // record's price IS the result, and providerIndicatedTimeUnixMs is the
    // record's time
    const response = await testAdapter.request(aaplRequest)
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      data: { result: 189.98 },
      result: 189.98,
      timestamps: {
        providerIndicatedTimeUnixMs: 1760000000000,
      },
    })
  })

  it('serves the TradeETH record when it is newer than the Trade', async () => {
    // Spec price endpoint: "Subscribe BOTH event types for every symbol; when
    // both arrive serve the record with the newest time." Receiving a TradeETH
    // result at all proves the TradeETH subscription went out on the single
    // dxLink connection next to the Trade one.
    const response = await requestUntilCached(priceRequest('price', 'TSM'), 1760000005000)
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      data: { result: 101.5 },
      result: 101.5,
      timestamps: {
        providerIndicatedTimeUnixMs: 1760000005000,
      },
    })
  })

  it('keeps serving the Trade when the TradeETH record is older', async () => {
    // Newest-time selection, mirrored: the regular-hours Trade (1760000006000)
    // is newer than the extended-hours TradeETH (1760000000000), and the frames
    // arrive Trade first, TradeETH last — the older TradeETH must be dropped.
    const response = await requestUntilCached(priceRequest('price', 'TRD'), 1760000006000)
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      data: { result: 90.5 },
      result: 90.5,
      timestamps: {
        providerIndicatedTimeUnixMs: 1760000006000,
      },
    })
  })

  it('serves the TradeETH record when it is the only record the symbol has sent', async () => {
    // Spec price endpoint: "Subscribe BOTH event types for every symbol;
    // Symbols without an ETH session simply yield no TradeETH events" — the
    // mirror case: a symbol whose ONLY record so far is the extended-hours
    // TradeETH is served from it; the regular-hours Trade side simply has no
    // data yet. Receiving the value at all proves the TradeETH subscription
    // went out next to the Trade one (owner decision
    // tradeteth_subscription_policy = match_reference, :USLF24 ticker).
    setFeedData('TradeETH', 'ETHS:USLF24', [
      'TradeETH',
      'ETHS:USLF24',
      1760000007000,
      102.25,
      5,
      12347,
      'V',
      0.2,
      5200000,
      1010000000,
      'UP',
      true,
    ])
    const response = await requestUntilCached(priceRequest('price', 'ETHS'), 1760000007000)
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      data: { result: 102.25 },
      result: 102.25,
      timestamps: {
        providerIndicatedTimeUnixMs: 1760000007000,
      },
    })
  })
})
