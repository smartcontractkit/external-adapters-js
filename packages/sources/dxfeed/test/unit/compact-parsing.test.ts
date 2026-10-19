import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { TradeProcessor } from '../../src/transport/price-ws'
import { quoteRecordToResult } from '../../src/transport/stock-quotes'
import { DxLinkFeed, DxLinkFeedDeps } from '../../src/transport/ws'
import frames from './fixtures/dxlink-frames.json'

LoggerFactoryProvider.set()

const QUOTE_PARAMS = { base: 'AAPL:USLF24', requireVolume: false, isOvernight: false }
const TRADE_PARAMS = { base: 'AAPL:USLF24', quote: 'USD' }

const quoteFeed = () => {
  const feed = new DxLinkFeed({
    formatTickers: () => [{ symbol: 'AAPL:USLF24', type: 'Quote' }],
    processRecord: (eventType, record, params: any) =>
      eventType === 'Quote' ? quoteRecordToResult(record, params) : undefined,
  } as DxLinkFeedDeps<any>)
  // FEED_CONFIG field order first (the open gate hands this over), then the
  // subscription index (normally populated by the custom builder)
  feed.onFeedConfig(frames.quoteFeedConfig.eventFields)
  feed.subscriptionMessages({ desired: [QUOTE_PARAMS], new: [QUOTE_PARAMS], stale: [] })
  return feed
}

describe('COMPACT FEED_DATA parsing (spec acceptDataFormat=COMPACT)', () => {
  it('splits the Quote sample frame positionally and serves the newest record (last record per wire key wins)', () => {
    const results = quoteFeed().message(frames.stockQuotesFrame as any)

    // The spec sample frame concatenates two records for the same wire key;
    // the LAST one is the freshest quote (bid 189.90/50, ask 190.10/80,
    // providerIndicatedTime 1760000001000, mid 190)
    expect(results).toHaveLength(1)
    const response = results[0] as any
    expect(response.result).toBe(190)
    expect(response.data).toEqual({
      mid_price: 190,
      bid_price: 189.9,
      bid_volume: 50,
      ask_price: 190.1,
      ask_volume: 80,
    })
    expect(response.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000001000 })
  })

  it('errors (502) on a record whose quote value is the "NaN" string', () => {
    const results = quoteFeed().message(frames.stockQuotesInvalidFrame as any)

    expect(results).toHaveLength(1)
    const error = results[0] as any
    expect(error.statusCode).toBe(502)
    expect(error.errorMessage).toContain('invalid')
  })

  it('truncates a trailing partial record instead of misparsing it', () => {
    const feed = quoteFeed()
    const partialFrame = {
      type: 'FEED_DATA',
      channel: 1,
      data: [
        'Quote',
        [
          ...frames.stockQuotesFrame.data[1].slice(0, 9),
          // a second record missing its last 5 fields
          'Quote',
          'AAPL:USLF24',
          1760000002000,
          1,
        ],
      ],
    }

    const results = feed.message(partialFrame as any)
    expect(results).toHaveLength(1)
    expect((results[0] as any).data.bid_price).toBe(189.95)
  })

  it('strips NUL padding from string fields before mapping the wire symbol', () => {
    const feed = quoteFeed()
    const paddedFrame = {
      type: 'FEED_DATA',
      channel: 1,
      data: [
        'Quote',
        ['Quote', 'AAPL:USLF24\x00', 1760000000000, 189.95, 190.05, 100, 200, 'V', 'V'],
      ],
    }

    const results = feed.message(paddedFrame as any)
    expect(results).toHaveLength(1)
    expect((results[0] as any).data.mid_price).toBe(190)
  })

  it('produces no results for ERROR, KEEPALIVE and CHANNEL_CLOSED control frames', () => {
    const feed = quoteFeed()
    for (const frame of [frames.errorFrame, frames.keepaliveFrame, frames.channelClosedFrame]) {
      expect(feed.message(frame as any)).toEqual([])
    }
  })

  it('serves the newest-time record when both Trade and TradeETH exist for a symbol', () => {
    // One processor for the whole sequence: the newest-time state lives on the
    // transport instance (round-2 item 4)
    const processor = new TradeProcessor()
    const feed = new DxLinkFeed({
      formatTickers: () => [
        { symbol: 'AAPL:USLF24', type: 'Trade' },
        { symbol: 'AAPL:USLF24', type: 'TradeETH' },
      ],
      processRecord: (eventType, record, params: any) =>
        processor.processRecord(eventType, record, params),
    } as DxLinkFeedDeps<any>)
    feed.onFeedConfig(frames.priceFeedConfig.eventFields)
    feed.subscriptionMessages({ desired: [TRADE_PARAMS], new: [TRADE_PARAMS], stale: [] })

    const tradeResults = feed.message(frames.priceTradeFrame as any)
    // Spec endpoint_request_response_examples[1]: {"data": {"result": 189.98}, "result": 189.98}
    expect((tradeResults[0] as any).result).toBe(189.98)
    expect((tradeResults[0] as any).data).toEqual({ result: 189.98 })
    // Spec endpoint_request_response_examples[1]: providerIndicatedTimeUnixMs 1760000000000
    expect((tradeResults[0] as any).timestamps).toEqual({
      providerIndicatedTimeUnixMs: 1760000000000,
    })

    const extendedFrame = {
      type: 'FEED_DATA',
      channel: 1,
      data: [
        'TradeETH',
        [
          'TradeETH',
          'AAPL:USLF24',
          1760000000500,
          190.02,
          5,
          12346,
          'V',
          0.13,
          5000001,
          999000001,
          'DOWN',
          true,
        ],
      ],
    }
    const newer = feed.message(extendedFrame as any)
    expect((newer[0] as any).result).toBe(190.02)

    // A late-arriving older record is dropped, not served
    const lateFrame = {
      type: 'FEED_DATA',
      channel: 1,
      data: [
        'Trade',
        [
          'Trade',
          'AAPL:USLF24',
          1760000000200,
          188.0,
          1,
          12344,
          'V',
          0.11,
          5000000,
          999000000,
          'UP',
          false,
        ],
      ],
    }
    expect(feed.message(lateFrame as any)).toEqual([])
  })
})

describe('merged: freshness-cache.test', () => {
  // The transport modules log via the framework logger, which needs a factory set
  LoggerFactoryProvider.set()

  const QUOTE_PARAMS = {
    base: 'AAPL:USLF24',
    quote: 'USD',
    requireVolume: false,
    isOvernight: false,
  }

  const quoteFeed = () => {
    const feed = new DxLinkFeed({
      formatTickers: (params: any) => [
        { symbol: String(params.base).toUpperCase(), type: 'Quote' },
      ],
      processRecord: (eventType, record, params: any) =>
        eventType === 'Quote' ? quoteRecordToResult(record, params) : undefined,
    } as DxLinkFeedDeps<any>)
    feed.onFeedConfig(frames.quoteFeedConfig.eventFields)
    feed.subscriptionMessages({ desired: [QUOTE_PARAMS], new: [QUOTE_PARAMS], stale: [] })
    return feed
  }

  /**
   * The spec sample timestamp (1760000000000 = 2025-10-09) is in the past relative
   * to any test clock — every assertion below proves staleness is reported via the
   * carried provider timestamp, never rejected.
   */

  describe('stale quote serving (owner decision stale_quote_serving=serve_last_value_with_timestamp)', () => {
    it('after the stream goes quiet the last value is served with its original providerIndicatedTimeUnixMs', () => {
      const response = quoteRecordToResult(
        ['Quote', 'AAPL:USLF24', 1760000000000, 189.95, 190.05, 100, 200, 'V', 'V'],
        QUOTE_PARAMS,
      ) as any

      // No max-age check exists: a stale record maps to a cacheable success
      expect(response.errorMessage).toBeUndefined()
      expect(response.statusCode).toBeUndefined()
      expect(response.result).toBe(190)
      expect(response.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
    })

    it('the same holds on the price path for stale trades', () => {
      const response = new TradeProcessor().processRecord(
        'Trade',
        frames.priceTradeFrame.data[1] as any,
        { base: 'AAPL:USLF24', quote: 'USD' } as any,
      ) as any

      expect(response.errorMessage).toBeUndefined()
      expect(response.statusCode).toBeUndefined()
      expect(response.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
    })
  })

  describe('reconnect window (owner decision reconnect_cache_behavior=serve_cached_last_value)', () => {
    it('a CHANNEL_CLOSED reconnect window serves the cached last value and does not error', () => {
      const feed = quoteFeed()

      // Last value before the stream drops — the newest record of the aggregated
      // frame per wire key (last-record-wins), timestamp 1760000001000
      const last = feed.message(frames.stockQuotesFrame as any)
      expect((last[0] as any).result).toBe(190)
      expect((last[0] as any).timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000001000 })

      // Stream dies: CHANNEL_CLOSED produces no error result and drops no mapping state
      expect(feed.message(frames.channelClosedFrame as any)).toEqual([])

      // The framework reconnects and re-delivers the whole desired set as `new`
      feed.subscriptionMessages({ desired: [QUOTE_PARAMS], new: [QUOTE_PARAMS], stale: [] })

      // The same last value still maps to a cacheable success carrying the original
      // provider timestamp, so the framework ResponseCache serves it during the window
      const again = feed.message(frames.stockQuotesFrame as any)
      expect(again).toHaveLength(1)
      expect((again[0] as any).errorMessage).toBeUndefined()
      expect((again[0] as any).result).toBe(190)
      expect((again[0] as any).timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000001000 })
    })
  })

  describe('degraded-stream alerting (owner decision degraded_stream_alerting=metrics_counters_only)', () => {
    it('repeated ERROR frames never raise a hard error and the stream keeps serving data', () => {
      const feed = quoteFeed()

      // An ERROR burst must not throw and must not poison the stream
      for (let i = 0; i < 10; i++) {
        expect(() => feed.message(frames.errorFrame as any)).not.toThrow()
        expect(feed.message(frames.errorFrame as any)).toEqual([])
      }

      // Data still maps to a success after the error burst — no failure-budget hard error
      const out = feed.message(frames.stockQuotesFrame as any)
      expect(out).toHaveLength(1)
      expect((out[0] as any).statusCode).toBeUndefined()
      expect((out[0] as any).errorMessage).toBeUndefined()
    })
  })
})
