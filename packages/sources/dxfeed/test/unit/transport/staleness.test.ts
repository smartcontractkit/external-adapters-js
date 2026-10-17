import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { TradeProcessor } from '../../../src/transport/price-ws'
import { quoteRecordToResult } from '../../../src/transport/stock-quotes'
import { DxLinkFeed, DxLinkFeedDeps } from '../../../src/transport/ws'
import frames from '../fixtures/dxlink-frames.json'

LoggerFactoryProvider.set()

const QUOTE_PARAMS = { base: 'AAPL:USLF24', quote: 'USD', requireVolume: false, isOvernight: false }
const TRADE_PARAMS = { base: 'AAPL:USLF24', quote: 'USD' }

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

    // Last value before the stream drops — the spec example record of the
    // aggregated frame per wire key (the golden vector's first-record mapping),
    // timestamp 1760000000000
    const last = feed.message(frames.stockQuotesFrame as any)
    expect((last[0] as any).result).toBe(190)
    expect((last[0] as any).timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })

    // Stream dies: a control frame only — no error result is produced
    expect(feed.message(frames.channelClosedFrame as any)).toEqual([])

    // The framework reconnects and re-delivers the whole desired set as `new`
    feed.subscriptionMessages({ desired: [QUOTE_PARAMS], new: [QUOTE_PARAMS], stale: [] })

    // The same last value still maps to a cacheable success, so the framework
    // ResponseCache serves it during the window instead of erroring
    const again = feed.message(frames.stockQuotesFrame as any)
    expect(again).toHaveLength(1)
    expect((again[0] as any).errorMessage).toBeUndefined()
    expect((again[0] as any).timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
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
