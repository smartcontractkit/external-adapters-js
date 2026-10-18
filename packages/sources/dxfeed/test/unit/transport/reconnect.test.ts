import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { quoteRecordToResult } from '../../../src/transport/stock-quotes'
import { DxLinkFeed, DxLinkFeedDeps } from '../../../src/transport/ws'
import frames from '../fixtures/dxlink-frames.json'

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
