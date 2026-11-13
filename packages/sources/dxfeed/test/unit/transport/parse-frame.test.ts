/**
 * dxLink COMPACT FEED_DATA parsing tests — OPDATA-9200 spec sample frames.
 *
 * Each case feeds the spec's sample frames (or a spec-derived edge case) to the
 * adapter through a scripted dxLink server and asserts the response_mapping
 * output: Quote -> bid/ask prices + volumes with mid = (bid+ask)/2 (one-sided
 * mid when one side is missing); Trade -> result = price;
 * providerIndicatedTimeUnixMs = the event time field. The JSON string "NaN" is
 * invalid; a trailing partial record is truncated; \\x00 is stripped;
 * non-FEED_DATA frames (ERROR, KEEPALIVE, CHANNEL_CLOSED, FEED_CONFIG) are
 * filtered.
 */
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers, { type InstalledClock } from '@sinonjs/fake-timers'
import {
  errorFrame,
  feedConfigFrame,
  flushFrames,
  keepaliveFrame,
  quoteFrame,
  quoteRecord,
  ScriptedDxLinkServer,
  tradeFrame,
  tradeRecord,
} from '../fixtures'

const WS_URL = 'ws://localhost:9093/dxlink-parse'

// Capture the framework loggers so the degenerate-FEED_CONFIG test can assert
// the transport's drop warn, and the run stays free of pino output.
const testLogger = {
  fatal: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
}
const loggerFactory = { child: () => testLogger } as any

describe('dxLink COMPACT frame parsing', () => {
  let oldEnv: NodeJS.ProcessEnv
  let server: ScriptedDxLinkServer
  let testAdapter: TestAdapter

  const quotesRequest = (base: string, extra: object = {}) => ({
    base,
    quote: 'USD',
    endpoint: 'stock_quotes',
    ...extra,
  })
  const overriddenQuotesRequest = (base: string, extra: object = {}) => ({
    ...quotesRequest(base, extra),
    overrides: { dxfeed: { [base]: `${base}:USLF24` } },
  })
  const priceRequest = (base: string) => ({
    endpoint: 'stock',
    from: base,
    to: 'USD',
    transport: 'ws',
    overrides: { dxfeed: { [base]: `${base}:USLF24` } },
  })

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.WS_API_ENDPOINT = WS_URL
    process.env.API_USERNAME = 'fake-user'
    process.env.API_PASSWORD = 'fake-pass'
    process.env.WS_SUBSCRIPTION_TTL = '60000'
    process.env.WS_SUBSCRIPTION_UNRESPONSIVE_TTL = '60000'
    process.env.CACHE_MAX_AGE = '60000'
    process.env.WS_CONNECTION_OPEN_TIMEOUT = '2000'
    process.env.WS_HEARTBEAT_INTERVAL_MS = '5000'

    server = new ScriptedDxLinkServer(WS_URL)
    // Spec sample_response (stock_quotes): two COMPACT Quote records in one
    // frame; the newest record is the spec example response.
    server.setFeedData('Quote', 'AAPL:USLF24', [
      quoteFrame(
        quoteRecord('AAPL:USLF24', 1760000000000, 189.95, 190.05, 100, 200, 'V', 'V'),
        quoteRecord('AAPL:USLF24', 1760000001000, 189.9, 190.1, 50, 80, 'O', 'O'),
      ),
    ])
    // One side zero (incumbent fallback): bid 0 -> mid = ask; ask 0 -> mid = bid.
    server.setFeedData('Quote', 'NO_ASK', [
      quoteFrame(quoteRecord('NO_ASK', 1760000002000, 170, 0, 10, 0)),
    ])
    server.setFeedData('Quote', 'NO_BID', [
      quoteFrame(quoteRecord('NO_BID', 1760000002000, 0, 190, 0, 10)),
    ])
    // Spec sample: the JSON string "NaN" is invalid.
    server.setFeedData('Quote', 'NANQ', [
      quoteFrame(quoteRecord('NANQ', 1760000000000, 'NaN', 190.05, 100, 200)),
    ])
    // Trailing partial record: the second record is cut mid-way and must be
    // truncated, never parsed as PART.
    server.setFeedData('Quote', 'GOOD:USLF24', [
      {
        type: 'FEED_DATA',
        channel: 1,
        data: [
          'Quote',
          [
            ...quoteRecord('GOOD:USLF24', 1760000002000, 10, 11, 1, 2),
            'Quote',
            'PART:USLF24',
            1760000003000,
            20,
          ],
        ],
      },
    ])
    // Strips \x00 from parsed strings, so the record matches the clean ticker.
    server.setFeedData('Quote', 'NULLSYM:USLF24', [
      quoteFrame(quoteRecord('NULLSYM:USLF24\x00', 1760000002000, 50, 51, 1, 1)),
    ])
    // Non-FEED_DATA frames are filtered; the data frame still parses.
    server.setFeedData('Quote', 'FLTR:USLF24', [
      errorFrame,
      keepaliveFrame,
      feedConfigFrame(),
      { type: 'CHANNEL_CLOSED', channel: 1 },
      quoteFrame(quoteRecord('FLTR:USLF24', 1760000002000, 60, 61, 1, 1)),
    ])
    // Trade parse: result = price, provider timestamp = time.
    server.setFeedData('Trade', 'PRC:USLF24', [
      tradeFrame('Trade', tradeRecord('Trade', 'PRC:USLF24', 1760000000000, 189.98)),
    ])
    // Trade parse: the JSON string "NaN" price is an error (incumbent parity).
    server.setFeedData('Trade', 'NANP:USLF24', [
      tradeFrame('Trade', tradeRecord('Trade', 'NANP:USLF24', 1760000000000, 'NaN')),
    ])
    // isOvernight: only exchange code O on both sides (Blue Ocean) is accepted.
    server.setFeedData('Quote', 'OVOK:USLF24', [
      quoteFrame(quoteRecord('OVOK:USLF24', 1760000002000, 10, 11, 1, 2, 'O', 'O')),
    ])
    server.setFeedData('Quote', 'OVVV:USLF24', [
      quoteFrame(quoteRecord('OVVV:USLF24', 1760000002000, 10, 11, 1, 2, 'V', 'V')),
    ])
    server.setFeedData('Quote', 'OVMIX:USLF24', [
      quoteFrame(quoteRecord('OVMIX:USLF24', 1760000002000, 10, 11, 1, 2, 'O', 'V')),
    ])
    // requireVolume: the JSON string "NaN" volume is invalid.
    server.setFeedData('Quote', 'RVZERO:USLF24', [
      quoteFrame(quoteRecord('RVZERO:USLF24', 1760000002000, 10, 11, 'NaN', 2)),
    ])
    server.setFeedData('Quote', 'RVERR:USLF24', [
      quoteFrame(quoteRecord('RVERR:USLF24', 1760000002000, 10, 11, 'NaN', 2)),
    ])
    // Trade + TradeETH both arrive for the same symbol: newest time wins.
    server.setFeedData('Trade', 'ETHNEW:USLF24', [
      tradeFrame('Trade', tradeRecord('Trade', 'ETHNEW:USLF24', 1760000000000, 189.98)),
    ])
    server.setFeedData('TradeETH', 'ETHNEW:USLF24', [
      tradeFrame('TradeETH', tradeRecord('TradeETH', 'ETHNEW:USLF24', 1760000005000, 191.5)),
    ])
    server.setFeedData('Trade', 'TRDNEW:USLF24', [
      tradeFrame('Trade', tradeRecord('Trade', 'TRDNEW:USLF24', 1760000009000, 195.25)),
    ])
    server.setFeedData('TradeETH', 'TRDNEW:USLF24', [
      tradeFrame('TradeETH', tradeRecord('TradeETH', 'TRDNEW:USLF24', 1760000001000, 191.5)),
    ])

    // One COMPACT frame can carry several event types: [type, values, type, values, ...]
    server.setFeedData('Trade', 'MULTI:USLF24', [
      {
        type: 'FEED_DATA',
        channel: 1,
        data: [
          'Trade',
          tradeRecord('Trade', 'MULTI:USLF24', 1760000000000, 100),
          'TradeETH',
          tradeRecord('TradeETH', 'MULTI:USLF24', 1760000001000, 101),
        ],
      },
    ])

    mockWebSocketProvider(WebSocketClassProvider)
    const adapter = (await import('./../../../src')).adapter
    // rateLimiting stays: undefined makes the fixed-interval period 0, which starves fake-timer ticks
    testAdapter = await TestAdapter.startWithMockedCache(
      adapter,
      {
        clock: FakeTimers.install({ now: Date.parse('2026-01-01T00:00:00Z') }),
        testAdapter: {} as TestAdapter<never>,
      },
      { loggerFactory },
    )
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    server.server.close()
    ;(testAdapter.clock as InstalledClock | undefined)?.uninstall()
    await testAdapter.api.close()
  })

  it('parses the spec Quote sample frame into the spec response_mapping output', async () => {
    const response = await testAdapter.request(overriddenQuotesRequest('AAPL'))
    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.data).toMatchObject({
      bid_price: 189.9,
      bid_volume: 50,
      ask_price: 190.1,
      ask_volume: 80,
    })
    // mid = (bidPrice + askPrice) / 2 over the newest record.
    expect(body.data.mid_price).toBeCloseTo(190, 10)
    expect(body.result).toBeCloseTo(190, 10)
    // provider_timestamp = time of the newest record.
    expect(body.timestamps?.providerIndicatedTimeUnixMs).toBe(1760000001000)
  })

  it('serves the non-zero side as the mid when one side is 0 (ask 0 -> mid = bid)', async () => {
    const response = await testAdapter.request(quotesRequest('NO_ASK'))
    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.data).toMatchObject({ bid_price: 170, ask_price: 0 })
    expect(body.data.mid_price).toBeCloseTo(170, 10)
    expect(body.timestamps?.providerIndicatedTimeUnixMs).toBe(1760000002000)
  })

  it('serves the non-zero side as the mid when one side is 0 (bid 0 -> mid = ask)', async () => {
    const response = await testAdapter.request(quotesRequest('NO_BID'))
    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.data).toMatchObject({ bid_price: 0, ask_price: 190 })
    expect(body.data.mid_price).toBeCloseTo(190, 10)
    expect(body.timestamps?.providerIndicatedTimeUnixMs).toBe(1760000002000)
  })

  it('errors with 502 when a price is the JSON string "NaN" (incumbent parity)', async () => {
    const response = await testAdapter.request(quotesRequest('NANQ'))
    expect(response.statusCode).toBe(502)
  })

  it('truncates a trailing partial record and never serves it', async () => {
    const good = await testAdapter.request(overriddenQuotesRequest('GOOD'))
    expect(good.statusCode).toBe(200)
    expect(good.json().data).toMatchObject({ bid_price: 10, ask_price: 11 })
    expect(good.json().data.mid_price).toBeCloseTo(10.5, 10)
    expect(good.json().timestamps?.providerIndicatedTimeUnixMs).toBe(1760000002000)

    const partial = await testAdapter.request(overriddenQuotesRequest('PART'))
    expect(partial.statusCode).not.toBe(200)
  })

  it('strips \\x00 from parsed strings', async () => {
    const response = await testAdapter.request(overriddenQuotesRequest('NULLSYM'))
    expect(response.statusCode).toBe(200)
    expect(response.json().data).toMatchObject({ bid_price: 50, ask_price: 51 })
  })

  it('filters ERROR, KEEPALIVE, FEED_CONFIG and CHANNEL_CLOSED frames', async () => {
    const response = await testAdapter.request(overriddenQuotesRequest('FLTR'))
    expect(response.statusCode).toBe(200)
    expect(response.json().data).toMatchObject({ bid_price: 60, ask_price: 61 })

    // The stream keeps flowing after the control frames.
    server.push(quoteFrame(quoteRecord('FLTR:USLF24', 1760000003000, 70, 71, 1, 1)))
    await flushFrames(testAdapter)
    const updated = await testAdapter.request(overriddenQuotesRequest('FLTR'))
    expect(updated.statusCode).toBe(200)
    expect(updated.json().data).toMatchObject({ bid_price: 70, ask_price: 71 })
  })

  it('parses a Trade frame to result = price with the provider timestamp', async () => {
    const response = await testAdapter.request(priceRequest('PRC'))
    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.data.result).toBe(189.98)
    expect(body.result).toBe(189.98)
    expect(body.timestamps?.providerIndicatedTimeUnixMs).toBe(1760000000000)
  })

  it('errors with 502 when a Trade price is the JSON string "NaN" (incumbent parity)', async () => {
    const response = await testAdapter.request(priceRequest('NANP'))
    expect(response.statusCode).toBe(502)
  })

  it('isOvernight accepts a quote with exchange code O on both sides', async () => {
    const response = await testAdapter.request(
      overriddenQuotesRequest('OVOK', { isOvernight: true }),
    )
    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.data).toMatchObject({ bid_price: 10, ask_price: 11 })
    expect(body.data.mid_price).toBeCloseTo(10.5, 10)
    expect(body.timestamps?.providerIndicatedTimeUnixMs).toBe(1760000002000)
  })

  it('isOvernight drops a quote whose exchange codes are not O on both sides', async () => {
    // Both sides on a non-overnight venue (V): dropped, never served.
    const rejected = await testAdapter.request(
      overriddenQuotesRequest('OVVV', { isOvernight: true }),
    )
    expect(rejected.statusCode).not.toBe(200)

    // Only one side on O is not accepted either ("only O on both sides").
    const mixed = await testAdapter.request(overriddenQuotesRequest('OVMIX', { isOvernight: true }))
    expect(mixed.statusCode).not.toBe(200)
  })

  it('requireVolume errors on an invalid volume instead of returning a zero', async () => {
    const response = await testAdapter.request(
      overriddenQuotesRequest('RVERR', { requireVolume: true }),
    )
    expect(response.statusCode).not.toBe(200)
  })

  it('without requireVolume an invalid volume is served as null (incumbent NaN payload)', async () => {
    const response = await testAdapter.request(overriddenQuotesRequest('RVZERO'))
    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.data).toMatchObject({
      bid_price: 10,
      ask_price: 11,
      bid_volume: null,
      ask_volume: 2,
    })
    // Prices are untouched by the invalid volume: the mid still computes.
    expect(body.data.mid_price).toBeCloseTo(10.5, 10)
  })

  it('when both Trade and TradeETH arrive, serves the record with the newest time', async () => {
    // TradeETH (1760000005000) is newer than Trade (1760000000000).
    const ethNewest = await testAdapter.request(priceRequest('ETHNEW'))
    expect(ethNewest.statusCode).toBe(200)
    const ethBody = ethNewest.json()
    expect(ethBody.data.result).toBe(191.5)
    expect(ethBody.result).toBe(191.5)
    expect(ethBody.timestamps?.providerIndicatedTimeUnixMs).toBe(1760000005000)

    // Trade (1760000009000) is newer than TradeETH (1760000001000).
    const tradeNewest = await testAdapter.request(priceRequest('TRDNEW'))
    expect(tradeNewest.statusCode).toBe(200)
    const tradeBody = tradeNewest.json()
    expect(tradeBody.data.result).toBe(195.25)
    expect(tradeBody.result).toBe(195.25)
    expect(tradeBody.timestamps?.providerIndicatedTimeUnixMs).toBe(1760000009000)
  })

  it('keeps serving the last value after a quiet period (no parse crash)', async () => {
    const before = await testAdapter.request(overriddenQuotesRequest('GOOD'))
    expect(before.statusCode).toBe(200)
    // Advance the installed clock past a quiet window, then a direct
    // cache-hit request: the last value is still served (no real timers —
    // awaiting a real sleep under the installed clock deadlocks).
    await flushFrames(testAdapter, 1000)
    const after = await testAdapter.request(overriddenQuotesRequest('GOOD'))
    expect(after.statusCode).toBe(200)
    expect(after.json().data).toMatchObject({ bid_price: 10, ask_price: 11 })
  })

  it('ignores an empty field list in FEED_CONFIG and keeps decoding with the previous one', async () => {
    server.push({ type: 'FEED_CONFIG', channel: 1, eventFields: { Quote: [] } })
    server.push(quoteFrame(quoteRecord('AAPL:USLF24', 1760000007000, 120, 121, 1, 2)))
    await flushFrames(testAdapter)
    const response = await testAdapter.request(overriddenQuotesRequest('AAPL'))
    expect(response.statusCode).toBe(200)
    expect(response.json().data).toMatchObject({ bid_price: 120, ask_price: 121 })
  })

  it('decodes every event type in a frame that carries more than one', async () => {
    const response = await testAdapter.request(priceRequest('MULTI'))
    expect(response.statusCode).toBe(200)
    expect(response.json().result).toBe(101)
  })

  it('does not replace a valid cached price with a newer invalid one', async () => {
    const before = await testAdapter.request(priceRequest('PRC'))
    expect(before.json().result).toBe(189.98)

    server.push(tradeFrame('Trade', tradeRecord('Trade', 'PRC:USLF24', 1760000001000, 'NaN')))
    await flushFrames(testAdapter)

    const after = await testAdapter.request(priceRequest('PRC'))
    expect(after.statusCode).toBe(200)
    expect(after.json().result).toBe(189.98)
  })
})
