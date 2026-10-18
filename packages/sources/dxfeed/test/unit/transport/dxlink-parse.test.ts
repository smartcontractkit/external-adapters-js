import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { quoteRecordToResult } from '../../../src/transport/stock-quotes'
import {
  DxLinkFeed,
  DxLinkFeedDeps,
  DxLinkRecord,
  parseCompactFeedData,
} from '../../../src/transport/ws'
import frames from '../fixtures/dxlink-frames.json'

// The transport modules log via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

/**
 * Plan round1-message-parsing proving test (spec stock_quotes sample_response
 * and owner decisions reconnect_cache_behavior / degraded_stream_alerting):
 * COMPACT FEED_DATA arrays parse positionally by the FEED_CONFIG eventFields
 * order, the JSON string "NaN" is invalid, a trailing partial record is
 * dropped, control frames produce no data result, and across a CHANNEL_CLOSED
 * reconnect window the cached last value is servable with its ORIGINAL
 * provider timestamp. The ResponseCache itself is framework-owned (out of
 * unit scope) — what the unit proves is that the adapter keeps mapping a
 * cacheable success carrying the record's own time, and that CHANNEL_CLOSED
 * resets no adapter state that serving it needs.
 */
const QUOTE_EVENT_FIELDS = frames.quoteFeedConfig.eventFields
const QUOTE_PARAMS = { base: 'AAPL:USLF24', quote: 'USD', requireVolume: false, isOvernight: false }

/** Position of a Quote field in the spec FEED_CONFIG eventFields.Quote order */
const fieldIndex = (field: string): number => QUOTE_EVENT_FIELDS.Quote.indexOf(field)

/** The subscribed quote feed, wired exactly like the production transport */
const quoteFeed = () => {
  const feed = new DxLinkFeed({
    formatTickers: (params: any) => [{ symbol: String(params.base).toUpperCase(), type: 'Quote' }],
    processRecord: (eventType, record, params: any) =>
      eventType === 'Quote' ? quoteRecordToResult(record, params) : undefined,
  } as DxLinkFeedDeps<any>)
  // FEED_CONFIG first (the open gate hands the layout over), then the
  // subscription index (normally populated by the customSubscriptionMessages
  // builder)
  feed.onFeedConfig(QUOTE_EVENT_FIELDS)
  feed.subscriptionMessages({ desired: [QUOTE_PARAMS], new: [QUOTE_PARAMS], stale: [] })
  return feed
}

describe('COMPACT FEED_DATA parsing (plan round1-message-parsing; spec stock_quotes sample_response)', () => {
  it('parses the spec COMPACT Quote frame positionally into the mapped fields', () => {
    // Spec sample_response frame: two 9-field Quote records concatenated flat
    // in the FEED_CONFIG eventFields order
    const records = parseCompactFeedData(
      'Quote',
      frames.stockQuotesFrame.data[1] as DxLinkRecord,
      QUOTE_EVENT_FIELDS,
    )

    expect(records).toHaveLength(2)
    expect(records[0][fieldIndex('eventSymbol')]).toBe('AAPL:USLF24')
    expect(records[0][fieldIndex('time')]).toBe(1760000000000)
    expect(records[0][fieldIndex('bidPrice')]).toBe(189.95)
    expect(records[0][fieldIndex('askPrice')]).toBe(190.05)
    expect(records[0][fieldIndex('bidSize')]).toBe(100)
    expect(records[0][fieldIndex('askSize')]).toBe(200)
    expect(records[0][fieldIndex('bidExchangeCode')]).toBe('V')
    expect(records[0][fieldIndex('askExchangeCode')]).toBe('V')

    // Record 2 carries distinct values at the same positions — proof the split
    // is positional, not a copy
    expect(records[1][fieldIndex('time')]).toBe(1760000001000)
    expect(records[1][fieldIndex('bidPrice')]).toBe(189.9)
    expect(records[1][fieldIndex('askPrice')]).toBe(190.1)
    expect(records[1][fieldIndex('bidExchangeCode')]).toBe('O')
    expect(records[1][fieldIndex('askExchangeCode')]).toBe('O')
  })

  it('a "NaN" price yields an invalid result (spec valueRangeScalingNotes: the JSON string "NaN" is invalid)', () => {
    // Spec sample_response, second FEED_DATA frame: "NaN" bidPrice
    const results = quoteFeed().message(frames.stockQuotesInvalidFrame as any)

    expect(results).toHaveLength(1)
    const error = results[0] as any
    expect(error.statusCode).toBe(502)
    expect(error.errorMessage).toContain('invalid')
    expect(error.result).toBeUndefined()
    expect(error.data).toBeUndefined()
  })

  it('drops a trailing partial record and keeps the complete one', () => {
    // The spec sample frame's first (complete) record followed by a second
    // record missing its last 5 of 9 fields
    const frameWithPartialTail = [
      ...frames.stockQuotesFrame.data[1].slice(0, QUOTE_EVENT_FIELDS.Quote.length),
      'Quote',
      'AAPL:USLF24',
      1760000002000,
      1,
    ] as DxLinkRecord

    const records = parseCompactFeedData('Quote', frameWithPartialTail, QUOTE_EVENT_FIELDS)
    expect(records).toHaveLength(1)
    expect(records[0][fieldIndex('time')]).toBe(1760000000000)
    expect(records[0][fieldIndex('bidPrice')]).toBe(189.95)

    // Through the message handler the torn tail must not surface as data
    const results = quoteFeed().message({
      type: 'FEED_DATA',
      channel: 1,
      data: ['Quote', frameWithPartialTail],
    } as any)
    expect(results).toHaveLength(1)
    expect((results[0] as any).data.bid_price).toBe(189.95)
  })

  it('ERROR, KEEPALIVE and CHANNEL_CLOSED frames produce no data result', () => {
    const feed = quoteFeed()
    for (const frame of [frames.errorFrame, frames.keepaliveFrame, frames.channelClosedFrame]) {
      expect(feed.message(frame as any)).toEqual([])
    }
  })

  it('across a CHANNEL_CLOSED reconnect window the last value stays servable with its ORIGINAL provider timestamp', () => {
    const feed = quoteFeed()

    // The last mapped value before the disconnect: mid 190.0 from the newest
    // record of the spec sample frame, timestamped by the record's own time
    const lastValue = feed.message(frames.stockQuotesFrame as any)
    expect(lastValue).toHaveLength(1)
    const expected = {
      result: 190.0,
      data: {
        mid_price: 190.0,
        bid_price: 189.9,
        bid_volume: 50,
        ask_price: 190.1,
        ask_volume: 80,
      },
      timestamps: { providerIndicatedTimeUnixMs: 1760000001000 },
    }
    expect(lastValue[0]).toMatchObject(expected)

    // The server closes the channel: no data result, and NO adapter mapping
    // state is reset — the framework's ResponseCache keeps serving this last
    // value (owner decision reconnect_cache_behavior=serve_cached_last_value)
    expect(feed.message(frames.channelClosedFrame as any)).toEqual([])

    // The framework reconnects and re-delivers the full desired set as `new`;
    // the adapter must still map frames — same shape, ORIGINAL provider
    // timestamp (owner decision stale_quote_serving=serve_last_value_with_
    // timestamp: never a max-age error, never a reset time)
    feed.subscriptionMessages({ desired: [QUOTE_PARAMS], new: [QUOTE_PARAMS], stale: [] })
    const afterReconnect = feed.message(frames.stockQuotesFrame as any)
    expect(afterReconnect).toHaveLength(1)
    expect(afterReconnect[0]).toMatchObject(expected)
    expect((afterReconnect[0] as any).statusCode).toBeUndefined()
    expect((afterReconnect[0] as any).errorMessage).toBeUndefined()
  })
})
