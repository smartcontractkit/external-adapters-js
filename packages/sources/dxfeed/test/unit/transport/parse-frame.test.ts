/**
 * dxLink COMPACT FEED_DATA parsing tests — OPDATA-9200 requirement doc.
 *
 * Each case feeds a requirement-doc sample frame (or a requirement-derived
 * edge case) through a scripted dxLink server and asserts the response:
 * - Quote -> mid, bid/ask, volumes; equity quotes need a positive bid and ask.
 * - Trade/TradeETH -> result = price, newest provider time wins.
 * - providerIndicatedTimeUnixMs = the event time field.
 * - "NaN"/"Infinity"/null/empty-string values are invalid, never 0.
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
  setDxLinkTestEnv,
  tradeFrame,
  tradeRecord,
} from '../fixtures'

const WS_URL = 'ws://localhost:9093/dxlink-parse'

// Capture the framework loggers so the run stays free of pino output.
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

  const quotesRequest = (base: string, extra: Record<string, unknown> = {}) => ({
    base,
    quote: 'USD',
    endpoint: 'stock_quotes',
    ...extra,
  })
  const overriddenQuotesRequest = (base: string, extra: Record<string, unknown> = {}) => ({
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

  const seedQuote = (symbol: string, ...records: unknown[][]): void => {
    server.setFeedData('Quote', symbol, [quoteFrame(...records)])
  }
  const seedTrade = (
    eventType: 'Trade' | 'TradeETH',
    symbol: string,
    time: number,
    price: number | string,
  ): void => {
    server.setFeedData(eventType, symbol, [
      tradeFrame(eventType, tradeRecord(eventType, symbol, time, price)),
    ])
  }

  const quoteBody = async (base: string, extra: Record<string, unknown> = {}) => {
    const response = await testAdapter.request(quotesRequest(base, extra))
    expect(response.statusCode).toBe(200)
    return response.json()
  }
  const overriddenQuoteBody = async (base: string, extra: Record<string, unknown> = {}) => {
    const response = await testAdapter.request(overriddenQuotesRequest(base, extra))
    expect(response.statusCode).toBe(200)
    return response.json()
  }
  const priceBody = async (base: string) => {
    const response = await testAdapter.request(priceRequest(base))
    expect(response.statusCode).toBe(200)
    return response.json()
  }
  const expectError = async (request: object) => {
    const response = await testAdapter.request(request)
    expect(response.statusCode).toBe(502)
    const body = response.json()
    expect(body.error ?? body.errorMessage).toBeDefined()
    return body
  }
  const expectNoValue = async (request: object) => {
    const response = await testAdapter.request(request)
    expect(response.statusCode).not.toBe(200)
    return response
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    setDxLinkTestEnv(WS_URL)
    server = new ScriptedDxLinkServer(WS_URL)

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

  it('parses the Quote sample frame into the response mapping', async () => {
    seedQuote(
      'AAPL:USLF24',
      quoteRecord('AAPL:USLF24', 1760000000000, 189.95, 190.05, 100, 200, 'V', 'V'),
      quoteRecord('AAPL:USLF24', 1760000001000, 189.9, 190.1, 50, 80, 'O', 'O'),
    )

    const body = await overriddenQuoteBody('AAPL')
    expect(body.data).toMatchObject({
      bid_price: 189.9,
      bid_volume: 50,
      ask_price: 190.1,
      ask_volume: 80,
      midSource: 'computed',
    })
    expect(body.data.mid_price).toBeCloseTo(190, 10)
    expect(body.result).toBeNull()
    expect(body.timestamps?.providerIndicatedTimeUnixMs).toBe(1760000001000)
  })

  describe('invalid equity quotes are rejected, never repaired', () => {
    const invalidCases: {
      name: string
      symbol: string
      bid: number | string
      ask: number | string
    }[] = [
      { name: 'zero bid', symbol: 'ZERO_BID', bid: 0, ask: 190 },
      { name: 'zero ask', symbol: 'ZERO_ASK', bid: 170, ask: 0 },
      { name: 'both sides zero', symbol: 'ZERO_BOTH', bid: 0, ask: 0 },
      { name: 'negative bid', symbol: 'NEG_BID', bid: -1, ask: 190 },
      { name: 'negative ask', symbol: 'NEG_ASK', bid: 170, ask: -1 },
      { name: 'empty-string bid', symbol: 'EMPTY_BID', bid: '', ask: 190 },
      { name: 'whitespace ask', symbol: 'SPACE_ASK', bid: 170, ask: ' ' },
      { name: 'string "0" bid', symbol: 'STRING_ZERO', bid: '0', ask: 190 },
    ]

    it.each(invalidCases)('rejects $name', async ({ symbol, bid, ask }) => {
      seedQuote(symbol, quoteRecord(symbol, 1760000002000, bid, ask, 1, 1))
      await expectError(quotesRequest(symbol))
    })

    it('rejects a crossed quote', async () => {
      seedQuote('CROSSED', quoteRecord('CROSSED', 1760000002000, 200, 190, 1, 1))
      await expectError(quotesRequest('CROSSED'))
    })

    it('rejects the JSON string "NaN"', async () => {
      seedQuote('NANQ', quoteRecord('NANQ', 1760000000000, 'NaN', 190.05, 100, 200))
      await expectError(quotesRequest('NANQ'))
    })
  })

  it('accepts zero volume as a valid size', async () => {
    seedQuote('ZERO_VOL', quoteRecord('ZERO_VOL', 1760000002000, 10, 11, 0, 0))
    const body = await quoteBody('ZERO_VOL', { requireVolume: true })
    expect(body.data).toMatchObject({ bid_volume: 0, ask_volume: 0, mid_price: 10.5 })
  })

  it('truncates a trailing partial record and never serves it', async () => {
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

    const good = await overriddenQuoteBody('GOOD')
    expect(good.data).toMatchObject({ bid_price: 10, ask_price: 11 })
    expect(good.data.mid_price).toBeCloseTo(10.5, 10)
    expect(good.timestamps?.providerIndicatedTimeUnixMs).toBe(1760000002000)

    const partial = await testAdapter.request(overriddenQuotesRequest('PART'))
    expect(partial.statusCode).not.toBe(200)
  })

  it('strips \\x00 from parsed strings', async () => {
    seedQuote('NULLSYM:USLF24', quoteRecord('NULLSYM:USLF24\x00', 1760000002000, 50, 51, 1, 1))
    const body = await overriddenQuoteBody('NULLSYM')
    expect(body.data).toMatchObject({ bid_price: 50, ask_price: 51 })
  })

  it('drops a record without a symbol and keeps the next valid one', async () => {
    server.setFeedData('Quote', 'EMPTY_SYM:USLF24', [
      quoteFrame(quoteRecord('', 1760000002000, 10, 11, 1, 1)),
      quoteFrame(quoteRecord('EMPTY_SYM:USLF24', 1760000003000, 20, 21, 1, 1)),
    ])
    const body = await overriddenQuoteBody('EMPTY_SYM')
    expect(body.data).toMatchObject({ bid_price: 20, ask_price: 21 })
  })

  it('drops a malformed FEED_DATA frame and keeps the next valid one', async () => {
    server.setFeedData('Quote', 'MALFORMED:USLF24', [
      { type: 'FEED_DATA', channel: 1, data: 'not-an-array' },
      quoteFrame(quoteRecord('MALFORMED:USLF24', 1760000002000, 10, 11, 1, 1)),
    ])
    const body = await overriddenQuoteBody('MALFORMED')
    expect(body.data).toMatchObject({ bid_price: 10, ask_price: 11 })
  })

  it('serves a quote with an invalid provider time without a timestamp', async () => {
    seedQuote('NO_TIME', quoteRecord('NO_TIME', 'NaN' as unknown as number, 10, 11, 1, 1))
    const body = await quoteBody('NO_TIME')
    expect(body.data).toMatchObject({ bid_price: 10, ask_price: 11 })
    expect(body.timestamps?.providerIndicatedTimeUnixMs).toBeUndefined()
  })

  it('filters ERROR, KEEPALIVE and FEED_CONFIG frames', async () => {
    server.setFeedData('Quote', 'FLTR:USLF24', [
      errorFrame,
      keepaliveFrame,
      feedConfigFrame(),
      quoteFrame(quoteRecord('FLTR:USLF24', 1760000002000, 60, 61, 1, 1)),
    ])
    const body = await overriddenQuoteBody('FLTR')
    expect(body.data).toMatchObject({ bid_price: 60, ask_price: 61 })

    server.push(quoteFrame(quoteRecord('FLTR:USLF24', 1760000003000, 70, 71, 1, 1)))
    await flushFrames(testAdapter)
    const updated = await overriddenQuoteBody('FLTR')
    expect(updated.data).toMatchObject({ bid_price: 70, ask_price: 71 })
  })

  it('parses a Trade frame to result = price with the provider timestamp', async () => {
    seedTrade('Trade', 'PRC:USLF24', 1760000000000, 189.98)
    const body = await priceBody('PRC')
    expect(body.data.result).toBe(189.98)
    expect(body.result).toBe(189.98)
    expect(body.timestamps?.providerIndicatedTimeUnixMs).toBe(1760000000000)
  })

  it('rejects a Trade price that is the JSON string "NaN"', async () => {
    seedTrade('Trade', 'NANP:USLF24', 1760000000000, 'NaN')
    await expectError(priceRequest('NANP'))
  })

  it('isOvernight accepts a quote with exchange code O on both sides', async () => {
    seedQuote('OVOK:USLF24', quoteRecord('OVOK:USLF24', 1760000002000, 10, 11, 1, 2, 'O', 'O'))
    const body = await overriddenQuoteBody('OVOK', { isOvernight: true })
    expect(body.data).toMatchObject({ bid_price: 10, ask_price: 11 })
    expect(body.data.mid_price).toBeCloseTo(10.5, 10)
    expect(body.timestamps?.providerIndicatedTimeUnixMs).toBe(1760000002000)
  })

  it('isOvernight rejects a quote that is not O on both sides', async () => {
    seedQuote('OVVV:USLF24', quoteRecord('OVVV:USLF24', 1760000002000, 10, 11, 1, 2, 'V', 'V'))
    seedQuote('OVMIX:USLF24', quoteRecord('OVMIX:USLF24', 1760000002000, 10, 11, 1, 2, 'O', 'V'))

    await expectNoValue(overriddenQuotesRequest('OVVV', { isOvernight: true }))
    await expectNoValue(overriddenQuotesRequest('OVMIX', { isOvernight: true }))
  })

  it('requireVolume rejects an invalid volume instead of returning a zero', async () => {
    seedQuote('RVERR:USLF24', quoteRecord('RVERR:USLF24', 1760000002000, 10, 11, 'NaN', 2))
    await expectError(overriddenQuotesRequest('RVERR', { requireVolume: true }))
  })

  it('without requireVolume an invalid volume is served as null', async () => {
    seedQuote('RVZERO:USLF24', quoteRecord('RVZERO:USLF24', 1760000002000, 10, 11, 'NaN', 2))
    const body = await overriddenQuoteBody('RVZERO')
    expect(body.data).toMatchObject({
      bid_price: 10,
      ask_price: 11,
      bid_volume: null,
      ask_volume: 2,
    })
    expect(body.data.mid_price).toBeCloseTo(10.5, 10)
  })

  it('treats negative volume as missing, not zero', async () => {
    seedQuote('NEG_VOL', quoteRecord('NEG_VOL', 1760000002000, 10, 11, -1, 2))
    const body = await quoteBody('NEG_VOL')
    expect(body.data).toMatchObject({
      bid_price: 10,
      ask_price: 11,
      bid_volume: null,
      ask_volume: 2,
    })
    await expectError(quotesRequest('NEG_VOL', { requireVolume: true }))
  })

  it('serves the newest when TradeETH is newer than Trade', async () => {
    seedTrade('Trade', 'ETHNEW:USLF24', 1760000000000, 189.98)
    seedTrade('TradeETH', 'ETHNEW:USLF24', 1760000005000, 191.5)
    const body = await priceBody('ETHNEW')
    expect(body.data.result).toBe(191.5)
    expect(body.timestamps?.providerIndicatedTimeUnixMs).toBe(1760000005000)
  })

  it('serves the newest when Trade is newer than TradeETH', async () => {
    seedTrade('Trade', 'TRDNEW:USLF24', 1760000009000, 195.25)
    seedTrade('TradeETH', 'TRDNEW:USLF24', 1760000001000, 191.5)
    const body = await priceBody('TRDNEW')
    expect(body.data.result).toBe(195.25)
    expect(body.timestamps?.providerIndicatedTimeUnixMs).toBe(1760000009000)
  })

  it('serves the regular-session Trade on a cold start until the newer TradeETH replay arrives', async () => {
    seedTrade('Trade', 'RESTART:USLF24', 1760000000000, 189.98)
    const before = await priceBody('RESTART')
    expect(before.data.result).toBe(189.98)
    expect(before.timestamps?.providerIndicatedTimeUnixMs).toBe(1760000000000)

    server.push(
      tradeFrame('TradeETH', tradeRecord('TradeETH', 'RESTART:USLF24', 1760000005000, 191.5)),
    )
    await flushFrames(testAdapter)

    const after = await priceBody('RESTART')
    expect(after.data.result).toBe(191.5)
    expect(after.timestamps?.providerIndicatedTimeUnixMs).toBe(1760000005000)
  })

  it('drops an older frame that arrives after a newer one', async () => {
    seedTrade('Trade', 'OLD:USLF24', 1760000005000, 200)
    const first = await priceBody('OLD')
    expect(first.result).toBe(200)

    server.push(tradeFrame('Trade', tradeRecord('Trade', 'OLD:USLF24', 1760000001000, 100)))
    await flushFrames(testAdapter)

    const after = await priceBody('OLD')
    expect(after.result).toBe(200)
    expect(after.timestamps?.providerIndicatedTimeUnixMs).toBe(1760000005000)
  })

  it('decodes every event type in a frame that carries more than one', async () => {
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
    const body = await priceBody('MULTI')
    expect(body.result).toBe(101)
  })

  it('ignores an empty field list in FEED_CONFIG and keeps the previous one', async () => {
    seedQuote('AAPL:USLF24', quoteRecord('AAPL:USLF24', 1760000000000, 189.95, 190.05, 1, 1))
    await overriddenQuoteBody('AAPL')

    server.push({ type: 'FEED_CONFIG', channel: 1, eventFields: { Quote: [] } })
    server.push(quoteFrame(quoteRecord('AAPL:USLF24', 1760000007000, 120, 121, 1, 2)))
    await flushFrames(testAdapter)

    const body = await overriddenQuoteBody('AAPL')
    expect(body.data).toMatchObject({ bid_price: 120, ask_price: 121 })
  })

  it('does not replace a valid cached price with a newer invalid one', async () => {
    seedTrade('Trade', 'PRC:USLF24', 1760000000000, 189.98)
    const before = await priceBody('PRC')
    expect(before.result).toBe(189.98)

    server.push(tradeFrame('Trade', tradeRecord('Trade', 'PRC:USLF24', 1760000001000, 'NaN')))
    await flushFrames(testAdapter)

    const after = await priceBody('PRC')
    expect(after.result).toBe(189.98)
  })
})
