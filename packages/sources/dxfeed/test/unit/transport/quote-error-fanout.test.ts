import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { quoteRecordToResult } from '../../../src/transport/stock-quotes'
import { DxLinkFeed, DxLinkFeedDeps } from '../../../src/transport/ws'
import frames from '../fixtures/dxlink-frames.json'

LoggerFactoryProvider.set()

type QuoteParams = {
  base: string
  quote: string
  requireVolume: boolean
  isOvernight: boolean
}

const BASE_PARAMS: QuoteParams = {
  base: 'AAPL:USLF24',
  quote: 'USD',
  requireVolume: false,
  isOvernight: false,
}

/**
 * Builds a feed whose subscription index maps EVERY params set in `subs` onto
 * the same wire key (Quote:AAPL:USLF24) — the dxLink fan-out state the
 * customSubscriptionMessages builder produces when two params combos resolve to
 * one provider subscription.
 */
const feedWithSubs = (subs: QuoteParams[]) => {
  const feed = new DxLinkFeed({
    formatTickers: (params: QuoteParams) => [{ symbol: params.base.toUpperCase(), type: 'Quote' }],
    processRecord: (eventType, record, params: QuoteParams) =>
      eventType === 'Quote' ? quoteRecordToResult(record, params) : undefined,
  } as DxLinkFeedDeps<any>)
  feed.onFeedConfig(frames.quoteFeedConfig.eventFields)
  feed.subscriptionMessages({ desired: subs, new: subs, stale: [] })
  return feed
}

// Spec stock_quotes sample_response, second FEED_DATA frame: a valid ask price
// but the bid price is the JSON string "NaN" (invalid per
// valueRangeScalingNotes). time=1760000000000.
const NAN_BID_PRICE_FRAME = frames.stockQuotesInvalidFrame

// Same record layout but with the invalid values in the VOLUME positions
const NAN_VOLUME_FRAME = {
  type: 'FEED_DATA',
  channel: 1,
  data: ['Quote', ['Quote', 'AAPL:USLF24', 1760000000000, 189.95, 190.05, 'NaN', 'NaN', 'V', 'V']],
}

describe('provider timestamp on 502 error results (spec report fields: timestamps.providerIndicatedTimeUnixMs on EVERY result)', () => {
  it('a "NaN" bid price yields a 502 carrying the record time', () => {
    const [result] = feedWithSubs([BASE_PARAMS]).message(NAN_BID_PRICE_FRAME as any)

    expect(result?.statusCode).toBe(502)
    expect(result?.errorMessage).toMatch(/[Pp]rice/)
    // The record's own time (spec data_freshness.timestamp_field = time), not
    // the adapter clock: the frame's only record carries time=1760000000000
    expect(result?.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
  })

  it('an invalid volume under requireVolume=true yields a 502 carrying the record time', () => {
    const result = quoteRecordToResult(NAN_VOLUME_FRAME.data[1] as any, {
      ...BASE_PARAMS,
      requireVolume: true,
    }) as any

    expect(result.statusCode).toBe(502)
    expect(result.errorMessage).toMatch(/[Vv]olume/)
    expect(result.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
  })
})

describe('per-params fan-out on one wire key (subsByWireKey keys results by exact params)', () => {
  it('one invalid-volume record: requireVolume=true gets the 502, requireVolume=false gets the value with the NaN volume serialized as null', () => {
    const lenient = { ...BASE_PARAMS, requireVolume: false }
    const strict = { ...BASE_PARAMS, requireVolume: true }
    const results = feedWithSubs([lenient, strict]).message(NAN_VOLUME_FRAME as any)

    expect(results).toHaveLength(2)

    const lenientResult = results.find((r) => r.params.requireVolume === false) as any
    const strictResult = results.find((r) => r.params.requireVolume === true) as any

    // Lenient params: the spec example mapping succeeds — mid of the live book,
    // and the invalid size passes through unchanged (NaN), which JSON
    // serializes to null on the wire
    expect(lenientResult.statusCode).toBeUndefined()
    expect(lenientResult.data).toEqual({
      mid_price: 190,
      bid_price: 189.95,
      bid_volume: NaN,
      ask_price: 190.05,
      ask_volume: NaN,
    })
    expect(JSON.parse(JSON.stringify(lenientResult.data)).bid_volume).toBeNull()
    expect(JSON.parse(JSON.stringify(lenientResult.data)).ask_volume).toBeNull()
    expect(lenientResult.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })

    // Strict params: the same record errors instead of zeroing the volumes
    expect(strictResult.statusCode).toBe(502)
    expect(strictResult.errorMessage).toMatch(/[Vv]olume/)
    expect(strictResult.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
  })

  it('one regular-venue record: isOvernight=true rejects it while isOvernight=false on the SAME wire key accepts it', () => {
    const overnight = { ...BASE_PARAMS, isOvernight: true }
    const regular = { ...BASE_PARAMS, isOvernight: false }
    const results = feedWithSubs([overnight, regular]).message(NAN_VOLUME_FRAME as any)

    // One record in, exactly one result out: the overnight params drop the
    // record (neither side quotes on 'O'), the regular params map it
    expect(results).toHaveLength(1)
    expect(results[0].params.isOvernight).toBe(false)
    expect((results[0] as any).data.mid_price).toBe(190)
  })
})

describe('merged: degraded-stream.test', () => {
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
   * Plan round1-degraded-stream-metrics proving test (framework METRICS_ENABLED
   * counters wsConnectionClosures / wsConnectionErrors / streamHandlerErrors;
   * owner decision degraded_stream_alerting=metrics_counters_only): forced WS
   * closes and provider ERROR frames are stream-control, never market data, and
   * NO failure budget ever turns them into a hard error — the stream keeps
   * serving data. (The framework metrics counters themselves are framework
   * business, out of unit scope; what the unit proves is that the adapter raises
   * no error and drops no serving capability on the degraded stream.)
   */
  describe('degraded-stream alerting (owner decision degraded_stream_alerting=metrics_counters_only)', () => {
    it('repeated provider ERROR frames never throw and never hard-fail the stream', () => {
      const feed = quoteFeed()

      // An ERROR burst must not throw and must not poison the stream — the
      // framework counters are the alerting, not an adapter-side failure budget
      for (let i = 0; i < 10; i++) {
        expect(() => feed.message(frames.errorFrame as any)).not.toThrow()
        expect(feed.message(frames.errorFrame as any)).toEqual([])
      }

      // Data still maps to a success after the error burst — no failure-budget error
      const out = feed.message(frames.stockQuotesFrame as any)
      expect(out).toHaveLength(1)
      expect((out[0] as any).statusCode).toBeUndefined()
      expect((out[0] as any).errorMessage).toBeUndefined()
      expect((out[0] as any).result).toBe(190)
    })

    it('KEEPALIVE, ERROR and CHANNEL_CLOSED frames produce no data events', () => {
      const feed = quoteFeed()
      for (const frame of [frames.keepaliveFrame, frames.errorFrame, frames.channelClosedFrame]) {
        expect(feed.message(frame as any)).toEqual([])
      }
    })
  })
})

describe('merged: metrics.test', () => {
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
   * Plan round1-degraded-stream-metrics proving test (framework METRICS_ENABLED
   * counters wsConnectionClosures / wsConnectionErrors / streamHandlerErrors;
   * owner decision degraded_stream_alerting=metrics_counters_only): forced WS
   * closes and provider ERROR frames are stream-control, never market data, and
   * NO failure budget ever turns them into a hard error — the stream keeps
   * serving data. The framework metrics counters themselves are framework
   * business, out of unit scope; what the unit proves is that the adapter raises
   * no error and drops no serving capability on the degraded stream.
   */
  describe('degraded-stream alerting (owner decision degraded_stream_alerting=metrics_counters_only)', () => {
    it('repeated provider ERROR frames never throw and never hard-fail the stream', () => {
      const feed = quoteFeed()

      // An ERROR burst must not throw and must not poison the stream — the
      // framework counters are the alerting, not an adapter-side failure budget
      for (let i = 0; i < 10; i++) {
        expect(() => feed.message(frames.errorFrame as any)).not.toThrow()
        expect(feed.message(frames.errorFrame as any)).toEqual([])
      }

      // Data still maps to a success after the error burst — no failure-budget error
      const out = feed.message(frames.stockQuotesFrame as any)
      expect(out).toHaveLength(1)
      expect((out[0] as any).statusCode).toBeUndefined()
      expect((out[0] as any).errorMessage).toBeUndefined()
      expect((out[0] as any).result).toBe(190)
    })

    it('KEEPALIVE, ERROR and CHANNEL_CLOSED frames produce no data events', () => {
      const feed = quoteFeed()
      for (const frame of [frames.keepaliveFrame, frames.errorFrame, frames.channelClosedFrame]) {
        expect(feed.message(frame as any)).toEqual([])
      }
    })
  })
})

describe('merged: reconnect.test', () => {
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
})

describe('merged: staleness-cache.test', () => {
  LoggerFactoryProvider.set()

  const PARAMS = { base: 'AAPL:USLF24', quote: 'USD', requireVolume: false, isOvernight: false }

  /** The production stock_quotes feed wiring: real ticker mapper + real record mapper. */
  const quoteFeed = () => {
    const feed = new DxLinkFeed({
      formatTickers: (params: any) => [
        { symbol: String(params.base).toUpperCase(), type: 'Quote' },
      ],
      processRecord: (eventType, record, params: any) =>
        eventType === 'Quote' ? quoteRecordToResult(record, params) : undefined,
    } as DxLinkFeedDeps<any>)
    feed.onFeedConfig(frames.quoteFeedConfig.eventFields)
    feed.subscriptionMessages({ desired: [PARAMS], new: [PARAMS], stale: [] })
    return feed
  }

  // Spec stock_quotes sample_response, first record. Its time (1760000000000,
  // 2025-10-09) is always in the past relative to the test clock: owner decision
  // stale_quote_serving=serve_last_value_with_timestamp means age must never
  // turn it into an error.
  const LAST_QUOTE_RECORD = [
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

  describe('stale quote serving (owner decision stale_quote_serving=serve_last_value_with_timestamp)', () => {
    it('serves the last Quote value with its ORIGINAL providerIndicatedTimeUnixMs and no error after the stream goes quiet', () => {
      const response = quoteRecordToResult(LAST_QUOTE_RECORD, PARAMS) as any

      // No max-age rejection exists: the stale record maps to a cacheable success
      expect(response.statusCode).toBeUndefined()
      expect(response.errorMessage).toBeUndefined()
      expect(response.result).toBe(190)
      expect(response.data.mid_price).toBe(190)
      expect(response.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
    })

    it('an ancient timestamp is served exactly like a fresh one — no staleness gate is wired into the mapping', () => {
      const ancient = [...LAST_QUOTE_RECORD]
      ancient[2] = 1000 // 1970-01-01 — maximally stale
      const response = quoteRecordToResult(ancient, PARAMS) as any

      expect(response.statusCode).toBeUndefined()
      expect(response.errorMessage).toBeUndefined()
      expect(response.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1000 })
    })
  })

  describe('reconnect window (owner decision reconnect_cache_behavior=serve_cached_last_value)', () => {
    it('CHANNEL_CLOSED produces no error and the last value stays servable through the re-handshake', () => {
      const feed = quoteFeed()

      // Last value before the stream drops
      const last = feed.message(frames.stockQuotesFrame as any)
      expect(last).toHaveLength(1)
      expect((last[0] as any).errorMessage).toBeUndefined()
      expect((last[0] as any).timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000001000 })

      // Stream dies: the in-band CHANNEL_CLOSED frame yields NO result at all —
      // never an error — while the framework owns the reconnect
      expect(feed.message(frames.channelClosedFrame as any)).toEqual([])

      // The framework reconnects and re-delivers the whole desired set as `new`
      feed.subscriptionMessages({ desired: [PARAMS], new: [PARAMS], stale: [] })

      // The same last value still maps to a cacheable success with its original
      // provider timestamp — the framework ResponseCache serves it during the
      // re-handshake window instead of an error
      const again = feed.message(frames.stockQuotesFrame as any)
      expect(again).toHaveLength(1)
      expect((again[0] as any).statusCode).toBeUndefined()
      expect((again[0] as any).errorMessage).toBeUndefined()
      expect((again[0] as any).result).toBe(190)
      expect((again[0] as any).timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000001000 })
    })
  })

  describe('degraded stream alerting (owner decision degraded_stream_alerting=metrics_counters_only)', () => {
    it('repeated ERROR frames produce no results and never throw a hard failure-budget error', () => {
      const feed = quoteFeed()

      for (let i = 0; i < 10; i++) {
        // An empty result array IS the no-throw proof: a thrown hard-error would
        // fail this assertion
        expect(feed.message(frames.errorFrame as any)).toEqual([])
      }

      // The stream still maps data after the error burst
      const out = feed.message(frames.stockQuotesFrame as any)
      expect(out).toHaveLength(1)
      expect((out[0] as any).statusCode).toBeUndefined()
    })
  })
})
