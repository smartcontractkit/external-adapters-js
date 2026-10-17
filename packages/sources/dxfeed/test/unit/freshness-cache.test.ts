import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { TradeProcessor } from '../../src/transport/price-ws'
import { quoteRecordToResult } from '../../src/transport/stock-quotes'
import { DxLinkFeed, DxLinkFeedDeps } from '../../src/transport/ws'
import frames from './fixtures/dxlink-frames.json'

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

    // Last value before the stream drops — the spec example record of the
    // aggregated frame per wire key (the golden vector's first-record mapping),
    // timestamp 1760000000000
    const last = feed.message(frames.stockQuotesFrame as any)
    expect((last[0] as any).result).toBe(190)
    expect((last[0] as any).timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })

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
    expect((again[0] as any).timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
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
