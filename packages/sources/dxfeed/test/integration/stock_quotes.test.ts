import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { mockDxLinkServer, setFeedData, setFeedDataRecords } from './dxlink-mocks'

// Captured before FakeTimers.install() replaces the global timers: the mock
// socket bridge delivers frames on a REAL timer, so every step yields fake
// time (background cycles) AND real time (frame delivery).
const realSetTimeout = setTimeout

const WS_URL = 'ws://localhost:9110/dxlink-chainlink'

// Spec stock_quotes sample_response, verbatim: ONE COMPACT FEED_DATA frame
// concatenating TWO Quote records for AAPL:USLF24 (the acceptAggregationPeriod=1
// batching). Quote field order per the spec FEED_CONFIG eventFields:
// eventType,eventSymbol,time,bidPrice,askPrice,bidSize,askSize,
// bidExchangeCode,askExchangeCode
setFeedDataRecords('Quote', 'AAPL:USLF24', [
  ['Quote', 'AAPL:USLF24', 1760000000000, 189.95, 190.05, 100, 200, 'V', 'V'],
  ['Quote', 'AAPL:USLF24', 1760000001000, 189.9, 190.1, 50, 80, 'O', 'O'],
])

// isOvernight rejection flow: the same top-of-book quoted on a non-overnight
// venue (exchange code V on both sides)
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

// isOvernight acceptance flow: quoted on the overnight venue (O, Blue Ocean)
// on BOTH sides
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

// requireVolume flow: prices valid, both volumes the JSON string "NaN"
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

// Spec endpoint_request_response_examples request (stock_quotes)
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

const quoteRequest = (from: string, extra?: Record<string, unknown>) => ({
  endpoint: 'stock_quotes',
  from,
  to: 'USD',
  overrides: {
    dxfeed: {
      [from]: `${from}:USLF24`,
    },
  },
  ...extra,
})

describe('stock_quotes on the dxLink transport (plan proving test)', () => {
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

    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockDxLinkServer(WS_URL)

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install({ now: Date.parse('2026-01-01T00:00:00Z') }),
      testAdapter: {} as TestAdapter<never>,
    })

    await requestUntilCached(aaplRequest, 1760000001000)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  it('matches the spec request/response example', async () => {
    // Spec endpoint_request_response_examples (stock_quotes): mid 190.0 over
    // bid 189.90 / ask 190.10, volumes 50/80, providerIndicatedTimeUnixMs
    // 1760000001000 — the freshest record of the spec sample_response frame
    const response = await testAdapter.request(aaplRequest)
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

  it('rejects a V/V quote when isOvernight=true', async () => {
    // Spec stock_quotes: "isOvernight accepts only exchange code O on both
    // sides (Blue Ocean)" — the V/V record is dropped, nothing is served:
    // the request stays unserved (504) across several background cycles
    const request = quoteRequest('NVCE', { isOvernight: true })
    const statusCodes: number[] = []
    let response = await testAdapter.request(request)
    for (let i = 0; i < 5; i++) {
      await step()
      statusCodes.push(response.statusCode)
      response = await testAdapter.request(request)
    }
    statusCodes.push(response.statusCode)
    expect(statusCodes.length).toBeGreaterThan(0)
    expect(new Set(statusCodes)).toEqual(new Set([504]))
  })

  it('accepts an O/O quote when isOvernight=true', async () => {
    const response = await requestUntilCached(quoteRequest('OOCE', { isOvernight: true }))
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

  it('errors on invalid volume when requireVolume=true', async () => {
    // Spec stock_quotes: "requireVolume errors on invalid volume" — the "NaN"
    // sizes surface as an error result, never a zero
    const response = await requestUntilCached(quoteRequest('NVOL', { requireVolume: true }))
    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchObject({
      errorMessage: expect.anything(),
      // The failed record's own Quote time rides the 502 so downstream
      // freshness reporting keeps a provider timestamp
      timestamps: { providerIndicatedTimeUnixMs: 1760000003000 },
    })
  })
})
