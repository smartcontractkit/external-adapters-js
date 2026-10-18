import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
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
