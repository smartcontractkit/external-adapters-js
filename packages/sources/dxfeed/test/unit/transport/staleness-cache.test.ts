import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { quoteRecordToResult } from '../../../src/transport/stock-quotes'
import { DxLinkFeed, DxLinkFeedDeps } from '../../../src/transport/ws'
import frames from '../fixtures/dxlink-frames.json'

LoggerFactoryProvider.set()

const PARAMS = { base: 'AAPL:USLF24', quote: 'USD', requireVolume: false, isOvernight: false }

/** The production stock_quotes feed wiring: real ticker mapper + real record mapper. */
const quoteFeed = () => {
  const feed = new DxLinkFeed({
    formatTickers: (params: any) => [{ symbol: String(params.base).toUpperCase(), type: 'Quote' }],
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
