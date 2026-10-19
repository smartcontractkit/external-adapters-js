import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { TradeProcessor } from '../../../src/transport/price-ws'
import { quoteRecordToResult } from '../../../src/transport/stock-quotes'
import { DxLinkFeed, DxLinkFeedDeps } from '../../../src/transport/ws'
import frames from '../fixtures/dxlink-frames.json'

// The transport modules log via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

const QUOTE_PARAMS = { base: 'AAPL:USLF24', quote: 'USD', requireVolume: false, isOvernight: false }

const quoteFeed = () => {
  const feed = new DxLinkFeed({
    formatTickers: (params: any) => [{ symbol: String(params.base).toUpperCase(), type: 'Quote' }],
    processRecord: (eventType, record, params: any) =>
      eventType === 'Quote' ? quoteRecordToResult(record, params) : undefined,
  } as DxLinkFeedDeps<any>)
  feed.onFeedConfig(frames.quoteFeedConfig.eventFields)
  feed.subscriptionMessages({ desired: [QUOTE_PARAMS], new: [QUOTE_PARAMS], stale: [] })
  return feed
}

// Spec stock_quotes sample_response, first record. The timestamp (2025-10-09) is
// in the past relative to any test clock: staleness must never turn it into an
// error (owner decision stale_quote_serving=serve_last_value_with_timestamp).
const SPEC_QUOTE_RECORD = [
  'Quote',
  'AAPL:USLF24',
  1760000000000,
  189.95,
  190.05,
  100,
  200,
  'V',
  'V',
]

// Spec price sample record: price 189.98, provider time 1760000000000
const SPEC_TRADE_RECORD = [
  'Trade',
  'AAPL:USLF24',
  1760000000000,
  189.98,
  10,
  12345,
  'V',
  0.12,
  5000000,
  999000000,
  'UP',
  false,
]

/**
 * Plan round1-freshness-stale-guard proving test (template
 * freshness-stale-t-guard; owner decision
 * stale_quote_serving=serve_last_value_with_timestamp): the stale-t-guard tracks
 * and reports staleness through the carried provider timestamp only — there is
 * no max-age rejection anywhere in the adapter, so a quote older than ANY
 * threshold still returns a cacheable success with its ORIGINAL
 * providerIndicatedTimeUnixMs.
 */
describe('stale-quote serving (owner decision stale_quote_serving=serve_last_value_with_timestamp)', () => {
  it('a quote older than any threshold still serves with its original provider timestamp and no error', () => {
    // A fixed "now" (the round date) so every age in the table is deterministic.
    // The adapter has no max-age check, so every age — including one far older
    // than any conceivable staleness threshold — must serve.
    const now = 1760000000000 + 7 * 24 * 60 * 60 * 1000 // one week after the sample
    for (const ageMs of [
      30_000, // 30 seconds
      60 * 60 * 1000, // 1 hour
      24 * 60 * 60 * 1000, // 1 day (overnight / weekend quiet)
      7 * 24 * 60 * 60 * 1000, // 1 week (market closed)
      365 * 24 * 60 * 60 * 1000, // 1 year
    ]) {
      const staleTime = now - ageMs
      const record = [...SPEC_QUOTE_RECORD]
      record[2] = staleTime

      const response = quoteRecordToResult(record, QUOTE_PARAMS) as any

      // Served — no 502, no error message, the spec mid value
      expect(response.statusCode).toBeUndefined()
      expect(response.errorMessage).toBeUndefined()
      expect(response.result).toBe(190.0)
      // The ORIGINAL provider timestamp rides the result (staleness reporting),
      // never clamped, dropped or rejected
      expect(response.timestamps).toEqual({ providerIndicatedTimeUnixMs: staleTime })
    }
  })

  it('a stale trade serves the same way on the price path (result=price, timestamp=time)', () => {
    const staleTime = 1760000000000 - 365 * 24 * 60 * 60 * 1000 // one year old
    const record = [...SPEC_TRADE_RECORD]
    record[2] = staleTime

    const response = new TradeProcessor().processRecord('Trade', record, {
      base: 'AAPL:USLF24',
      quote: 'USD',
    } as any) as any

    expect(response.statusCode).toBeUndefined()
    expect(response.errorMessage).toBeUndefined()
    // Spec price response_mapping: result = price
    expect(response.result).toBe(189.98)
    expect(response.timestamps).toEqual({ providerIndicatedTimeUnixMs: staleTime })
  })

  it('a quote with no finite provider time still serves, carrying no timestamp rather than a NaN one', () => {
    // The staleness guard reports through the provider timestamp; a record with
    // a nonnumeric time has nothing to report and must not fabricate one
    const record = [...SPEC_QUOTE_RECORD]
    record[2] = 'NaN'

    const response = quoteRecordToResult(record, QUOTE_PARAMS) as any

    expect(response.statusCode).toBeUndefined()
    expect(response.errorMessage).toBeUndefined()
    expect(response.result).toBe(190.0)
    expect(response.timestamps).toBeUndefined()
  })
})

describe('reconnect window (owner decision reconnect_cache_behavior=serve_cached_last_value)', () => {
  it('across a CHANNEL_CLOSED reconnect window the last value stays servable with its ORIGINAL provider timestamp', () => {
    const feed = quoteFeed()

    // The last mapped value before the disconnect: mid 190.0 from the newest
    // record of the spec sample frame, timestamped by the record's own time
    const last = feed.message(frames.stockQuotesFrame as any)
    expect((last[0] as any).result).toBe(190)
    expect((last[0] as any).timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000001000 })

    // Stream dies: CHANNEL_CLOSED produces no error result and drops no mapping
    // state the ResponseCache needs (the framework owns the reconnect itself)
    expect(feed.message(frames.channelClosedFrame as any)).toEqual([])

    // The framework reconnects and re-delivers the full desired set as `new`;
    // the same last value still maps to a cacheable success carrying the
    // ORIGINAL provider timestamp — never a max-age error, never a reset time
    feed.subscriptionMessages({ desired: [QUOTE_PARAMS], new: [QUOTE_PARAMS], stale: [] })
    const again = feed.message(frames.stockQuotesFrame as any)
    expect(again).toHaveLength(1)
    expect((again[0] as any).statusCode).toBeUndefined()
    expect((again[0] as any).errorMessage).toBeUndefined()
    expect((again[0] as any).result).toBe(190)
    expect((again[0] as any).timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000001000 })
  })
})

describe('merged: staleness.test', () => {
  LoggerFactoryProvider.set()

  const QUOTE_PARAMS = {
    base: 'AAPL:USLF24',
    quote: 'USD',
    requireVolume: false,
    isOvernight: false,
  }
  const TRADE_PARAMS = { base: 'AAPL:USLF24', quote: 'USD' }

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

  // Spec stock_quotes sample_response, first record. The timestamp (2025-10-09) is
  // in the past relative to any test clock: staleness must never turn it into an
  // error (owner decision stale_quote_serving=serve_last_value_with_timestamp).
  const SPEC_QUOTE_RECORD = [
    'Quote',
    'AAPL:USLF24',
    1760000000000,
    189.95,
    190.05,
    100,
    200,
    'V',
    'V',
  ]

  describe('stale-quote serving (owner decision stale_quote_serving=serve_last_value_with_timestamp)', () => {
    it('after quotes stop arriving, the last value is served with its original providerIndicatedTimeUnixMs and no error', () => {
      const response = quoteRecordToResult(SPEC_QUOTE_RECORD, QUOTE_PARAMS) as any

      expect(response.errorMessage).toBeUndefined()
      expect(response.statusCode).toBeUndefined()
      expect(response.result).toBe(190)
      expect(response.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
    })

    it('a stale trade is served the same way — no max-age rejection exists on the price path', () => {
      const response = new TradeProcessor().processRecord(
        'Trade',
        frames.priceTradeFrame.data[1] as any,
        TRADE_PARAMS as any,
      ) as any

      expect(response.errorMessage).toBeUndefined()
      expect(response.statusCode).toBeUndefined()
      expect(response.result).toBe(189.98)
      expect(response.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
    })
  })

  describe('reconnect window (owner decision reconnect_cache_behavior=serve_cached_last_value)', () => {
    it('CHANNEL_CLOSED drops no mapping state and the last value stays servable across the reconnect + re-handshake', () => {
      const feed = quoteFeed()

      // Last value before the stream drops — the newest record of the aggregated
      // frame per wire key (last-record-wins), timestamp 1760000001000
      const last = feed.message(frames.stockQuotesFrame as any)
      expect((last[0] as any).result).toBe(190)
      expect((last[0] as any).timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000001000 })

      // Stream dies: a control frame only — no error result is produced
      expect(feed.message(frames.channelClosedFrame as any)).toEqual([])

      // The framework reconnects and re-delivers the whole desired set as `new`
      feed.subscriptionMessages({ desired: [QUOTE_PARAMS], new: [QUOTE_PARAMS], stale: [] })

      // The same last value still maps to a cacheable success, so the framework
      // ResponseCache serves it during the window instead of erroring
      const again = feed.message(frames.stockQuotesFrame as any)
      expect(again).toHaveLength(1)
      expect((again[0] as any).errorMessage).toBeUndefined()
      expect((again[0] as any).timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000001000 })
    })
  })

  describe('degraded-stream alerting (owner decision degraded_stream_alerting=metrics_counters_only)', () => {
    it('repeated provider ERROR frames never hard-fail the stream — staleness is reported, not rejected', () => {
      const feed = quoteFeed()

      for (let i = 0; i < 10; i++) {
        expect(feed.message(frames.errorFrame as any)).toEqual([])
      }

      // The stream still maps data after the error burst
      const out = feed.message(frames.stockQuotesFrame as any)
      expect(out).toHaveLength(1)
      expect((out[0] as any).statusCode).toBeUndefined()
    })
  })
})
