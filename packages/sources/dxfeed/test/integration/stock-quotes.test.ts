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

const WS_URL = 'ws://localhost:9097/dxlink-chainlink'

// Spec stock_quotes sample_response Quote field order:
// eventType,eventSymbol,time,bidPrice,askPrice,bidSize,askSize,
// bidExchangeCode,askExchangeCode

// Spec stock_quotes sample_response, second FEED_DATA frame: TWO Quote records
// for AAPL:USLF24 concatenated in one COMPACT frame (the acceptAggregationPeriod=1
// batching). Overrides the single-record dxlink-mocks.ts frame for this suite: the
// adapter processes both records and serves the LAST (freshest) one per wire
// key — the spec endpoint_request_response_examples response derives from that
// second record (providerIndicatedTimeUnixMs 1760000001000).
setFeedDataRecords('Quote', 'AAPL:USLF24', [
  ['Quote', 'AAPL:USLF24', 1760000000000, 189.95, 190.05, 100, 200, 'V', 'V'],
  ['Quote', 'AAPL:USLF24', 1760000001000, 189.9, 190.1, 50, 80, 'O', 'O'],
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

// isOvernight flow: same book quoted on a non-overnight venue (V), rejected...
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
// ...and on the overnight venue (O, Blue Ocean) on BOTH sides, accepted
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

// One-sided book: no bid (bidPrice 0), mid comes from the live ask side
setFeedData('Quote', 'ONE:USLF24', [
  'Quote',
  'ONE:USLF24',
  1760000004000,
  0,
  190.05,
  0,
  200,
  'V',
  'V',
])

// Malformed record: invalid price ("NaN") AND a nonnumeric time — nothing
// about it is usable as a number-typed report field (plan item: never emit
// NaN in a number-typed field)
setFeedData('Quote', 'BADT:USLF24', [
  'Quote',
  'BADT:USLF24',
  'not-a-time',
  'NaN',
  190.05,
  100,
  200,
  'V',
  'V',
])

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

// Spec endpoint_request_response_examples request (stock_quotes, AAPL)
const aaplRequest = quoteRequest('AAPL')

describe('stock_quotes endpoint semantics on the dxLink transport', () => {
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

    await requestUntilCached(aaplRequest)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  it('serves the spec example response', async () => {
    // Spec endpoint_request_response_examples (stock_quotes, AAPL): the golden
    // example response derives from the freshest (second) record of the spec
    // sample_response's two-record Quote frame — mid 190.0 over bid 189.90 /
    // ask 190.10, volumes 50/80, providerIndicatedTimeUnixMs 1760000001000
    const response = await requestUntilCached(aaplRequest, 1760000001000)
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
    // Spec stock_quotes: "requireVolume errors on invalid volumes"
    const response = await requestUntilCached(quoteRequest('NVOL', { requireVolume: true }))
    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchObject({
      errorMessage: expect.anything(),
      // The provider timestamp is a report field on EVERY result (spec
      // intake.purposeHowUsed): the failed record's own Quote time rides the 502
      timestamps: { providerIndicatedTimeUnixMs: 1760000003000 },
    })
  })

  it('passes invalid volumes through unchanged (null on the wire) without requireVolume and keeps the mid', async () => {
    // Plan round-2 item 1 (reference semantics): without requireVolume the parsed
    // bidSize/askSize value passes through unchanged, NaN included — JSON
    // serializes NaN to null on the wire. No code path may coerce the invalid
    // volume to 0. The requireVolume=true error flow is asserted above.
    const response = await requestUntilCached(quoteRequest('NVOL'))
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      data: {
        mid_price: 190.0,
        bid_price: 189.95,
        bid_volume: null,
        ask_price: 190.05,
        ask_volume: null,
      },
      result: 190.0,
      timestamps: {
        providerIndicatedTimeUnixMs: 1760000003000,
      },
    })
  })

  it('rejects a Quote whose exchange codes are not O on both sides when isOvernight=true', async () => {
    // Spec stock_quotes: "isOvernight accepts only exchange code O on both
    // sides (Blue Ocean)" — the V/V record is dropped, nothing is served
    const statusCodes = await requestStaysUnavailable(quoteRequest('NVCE', { isOvernight: true }))
    expect(statusCodes.length).toBeGreaterThan(0)
    expect(new Set(statusCodes)).toEqual(new Set([504]))
  })

  it('accepts a Quote with exchange code O on both sides when isOvernight=true', async () => {
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

  it('fans one wire key out per params: the record the isOvernight=true request drops serves the same symbol without it', async () => {
    // Plan item (per-params fan-out): the dxLink fan-out keys results by exact
    // params through the wire-key reverse index, so ONE wire record
    // (Quote:NVCE:USLF24) serves each params combo its own result — the
    // isOvernight=true request above stays unserved (504) while the same symbol
    // WITHOUT isOvernight is served that same record.
    const response = await requestUntilCached(quoteRequest('NVCE'))
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
        providerIndicatedTimeUnixMs: 1760000006000,
      },
    })
  })

  it('mids a one-sided Quote against the live side', async () => {
    // Reference semantics: no bid (bidPrice 0) — the mid is the ask
    const response = await requestUntilCached(quoteRequest('ONE'))
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      data: {
        mid_price: 190.05,
        bid_price: 0,
        bid_volume: 0,
        ask_price: 190.05,
        ask_volume: 200,
      },
      result: 190.05,
      timestamps: {
        providerIndicatedTimeUnixMs: 1760000004000,
      },
    })
  })

  it('emits no providerIndicatedTimeUnixMs on a 502 whose record time is nonnumeric — never NaN, never null', async () => {
    // Plan item (never emit NaN in a number-typed field): the BADT record is
    // malformed on both counts — the JSON string "NaN" bid price AND a
    // nonnumeric time. The 502 error result must omit
    // timestamps.providerIndicatedTimeUnixMs entirely (a serialized NaN or an
    // explicit null in the report field is exactly what this forbids —
    // timestamps.providerIndicatedTimeUnixMs is a downstream report field per
    // spec intake.purposeHowUsed). A valid-time 502 record keeps its numeric
    // provider timestamp: the NVOL=true flow above asserts that half.
    const response = await requestUntilCached(quoteRequest('BADT'))
    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchObject({ errorMessage: expect.anything() })
    const timestamps = response.json().timestamps ?? {}
    expect(timestamps.providerIndicatedTimeUnixMs).toBeUndefined()
  })
})
