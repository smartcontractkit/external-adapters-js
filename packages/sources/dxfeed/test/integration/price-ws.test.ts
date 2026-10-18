import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import nock from 'nock'
import { clientFrameLog, mockDxLinkServer, setFeedData } from './dxlink-mocks'
import { FAKE_REST_ENDPOINT, mockBatchedRestTransport } from './rest-mocks'

// Captured before FakeTimers.install() replaces the global timers: the mock
// socket bridge delivers frames on a REAL timer, so every step yields fake
// time (background cycles) AND real time (frame delivery, nock I/O).
const realSetTimeout = setTimeout

const WS_URL = 'ws://localhost:9103/dxlink-chainlink'

// Spec price sample_response Trade record fields:
// eventType,eventSymbol,time,price,size,sequence,exchangeCode,change,
// dayVolume,dayTurnover,tickDirection,extendedTradingHours

// Plan round-2 item 5 (endpoint-price routing pair): the `transport` param is
// carried at runtime by priceParamsDefinition and read by the framework router
// against the endpoint's transportRoutes (ws -> the dxLink WebSocketTransport,
// rest -> the untouched price-http transport). Each routing case uses a symbol
// served by exactly ONE of the two mocks, so the served value itself proves
// which transport resolved the request:
// - WSRV exists ONLY as a Trade record on the mock dxLink socket (and is in no
//   REST fixture), and no nock interceptor can produce its price
// - IBM exists ONLY in the batched REST fixture (no dxLink frame is registered
//   for it, so the ws transport could never serve it)
setFeedData('Trade', 'WSRV', [
  'Trade',
  'WSRV',
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

// The Trade/TradeETH pair for the "newer TradeETH supersedes" flow. The mock
// server pushes each frame only when the wire FEED_SUBSCRIPTION add carries its
// entry, so a TradeETH result at all proves the dual subscription went out —
// and the newest-time (TradeETH) record is what must be served.
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
// supersede the newer Trade — this is the case that discriminates newest-time
// selection from last-arrival selection.
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

// Bare-ticker flow (no :USLF24 suffix, no override): the owner decision
// tradeteth_subscription_policy = match_reference gates the TradeETH
// subscription on the :USLF24 ticker suffix, so this symbol's wire
// FEED_SUBSCRIPTION adds must carry the Trade entry ONLY.
setFeedData('Trade', 'BARET', [
  'Trade',
  'BARET',
  1760000009000,
  55.5,
  10,
  12345,
  'V',
  0.12,
  5000000,
  999000000,
  'UP',
  false,
])

const wsRequest = (base: string): Record<string, unknown> => ({
  endpoint: 'stock',
  base,
  to: 'USD',
  transport: 'ws',
  overrides: {
    dxfeed: {
      [base]: `${base}:USLF24`,
    },
  },
})

describe('price endpoint transport routing (plan item 5)', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  const step = async () => {
    await testAdapter.clock?.tickAsync(1000)
    await new Promise((resolve) => realSetTimeout(resolve, 10))
  }

  // The first request of either transport may 504 while its background cycle
  // resolves (WS handshake + FEED_DATA frames, REST batch fetch); poll
  // deterministically until the cache holds a value at `untilTimestamp`
  // (any value when omitted)
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

  // The FEED_SUBSCRIPTION add entries the adapter actually put on the dxLink
  // wire for the suite's single connection
  const subscriptionAdds = (): { symbol: string; type: string }[] =>
    (clientFrameLog[0] ?? [])
      .map((raw) => {
        try {
          return JSON.parse(raw)
        } catch {
          return undefined
        }
      })
      .filter((m: any) => m?.type === 'FEED_SUBSCRIPTION')
      .flatMap((m: any) => m.add ?? [])

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
    // The untouched REST transport reads API_ENDPOINT from settings, so the
    // nock interceptor in rest-mocks.ts is what REST requests hit — never a
    // real provider host
    process.env['API_ENDPOINT'] = FAKE_REST_ENDPOINT

    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockDxLinkServer(WS_URL)
    mockBatchedRestTransport()

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install({ now: Date.parse('2026-01-01T00:00:00Z') }),
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
    // cleanAll only: nock.restore() kills the interceptor process-wide, so any
    // suite sharing this jest worker afterwards would hit real DNS instead of
    // its mock (the repo-wide teardown convention)
    nock.cleanAll()
  })

  it('routes a transport="ws" request through the dxLink transport and serves its result', async () => {
    // Spec price input_parameters: "ws" (dxLink stream). Validation passes with
    // the reserved-name transport param present, and the served 187.25 can only
    // have come from the mock dxLink socket's WSRV Trade record
    const response = await requestUntilCached(
      { endpoint: 'stock', base: 'WSRV', to: 'USD', transport: 'ws' },
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

  it('routes a transport="rest" request through the REST transport', async () => {
    // Spec price input_parameters: "rest". The served 142.5 can only have come
    // from the nock REST fixture (no dxLink frame exists for IBM), and the
    // request passes validation with the transport param present
    const response = await requestUntilCached({
      endpoint: 'stock',
      base: 'IBM',
      to: 'USD',
      transport: 'rest',
    })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      data: { result: 142.5 },
      result: 142.5,
    })
  })

  it('falls a request without a transport param through to the REST transport', async () => {
    // Spec price: defaultTransport "rest" (owner decision
    // rest_transport_scope = keep_untouched) — no transport param means the
    // untouched REST path, not the dxLink socket. The served 239.255 comes
    // only from the nock REST fixture.
    const response = await requestUntilCached({
      endpoint: 'stock',
      base: 'TSLA',
      to: 'USD',
    })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      data: { result: 239.255 },
      result: 239.255,
    })
  })

  it('subscribes Trade plus TradeETH only for :USLF24 tickers, and Trade only for bare tickers', async () => {
    // Owner decision tradeteth_subscription_policy = match_reference: the
    // TradeETH subscription is gated on the :USLF24 ticker suffix. The
    // FEED_SUBSCRIPTION add frames the adapter actually put on the dxLink wire
    // are the proof: TSM:USLF24 gets BOTH entries; BARET gets Trade only.
    const tsm = await requestUntilCached(wsRequest('TSM'), 1760000005000)
    expect(tsm.statusCode).toBe(200)
    const bare = await requestUntilCached({
      endpoint: 'stock',
      base: 'BARET',
      to: 'USD',
      transport: 'ws',
    })
    expect(bare.statusCode).toBe(200)

    const adds = subscriptionAdds()
    expect(adds).toContainEqual({ symbol: 'TSM:USLF24', type: 'Trade' })
    expect(adds).toContainEqual({ symbol: 'TSM:USLF24', type: 'TradeETH' })
    expect(adds).toContainEqual({ symbol: 'BARET', type: 'Trade' })
    expect(adds).not.toContainEqual({ symbol: 'BARET', type: 'TradeETH' })
  })

  it('serves the newest-time record when Trade and TradeETH both arrive for the symbol', async () => {
    // Spec price endpoint: "when both arrive serve the record with the newest
    // time", and response_mapping.provider_timestamp = time.
    // TSM: the TradeETH (1760000005000, 101.5) is newer than the Trade
    // (1760000000000, 100) and arrives last — it wins.
    const tsm = await testAdapter.request(wsRequest('TSM'))
    expect(tsm.statusCode).toBe(200)
    expect(tsm.json()).toMatchObject({
      data: { result: 101.5 },
      result: 101.5,
      timestamps: {
        providerIndicatedTimeUnixMs: 1760000005000,
      },
    })

    // TRD (the discriminating mirror): the Trade (1760000006000, 90.5) is the
    // NEWER record but the older TradeETH (1760000000000, 90.0) arrives LAST —
    // newest-time selection must keep serving the Trade.
    const trd = await requestUntilCached(wsRequest('TRD'), 1760000006000)
    expect(trd.statusCode).toBe(200)
    expect(trd.json()).toMatchObject({
      data: { result: 90.5 },
      result: 90.5,
      timestamps: {
        providerIndicatedTimeUnixMs: 1760000006000,
      },
    })
  })
})
