import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { quoteRecordToResult } from '../../../src/transport/stock-quotes'
import {
  DxLinkFeed,
  DxLinkFeedDeps,
  DxLinkRecord,
  openDxLinkConnection,
  parseCompactFeedData,
} from '../../../src/transport/ws'
import frames from '../fixtures/dxlink-frames.json'

// The transport modules log via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

/**
 * Plan round1-compact-parsing proving test: dxLink FEED_DATA arrives in COMPACT
 * format — positional arrays mapped by the FEED_SETUP acceptEventFields order —
 * with control frames filtered, "NaN" invalid, torn tails truncated and \x00
 * stripped. Every value traces to the spec stock_quotes sample_response and
 * response_mapping, never to the implementation's output.
 */
const QUOTE_EVENT_FIELDS = frames.quoteFeedConfig.eventFields
const QUOTE_PARAMS = { base: 'AAPL:USLF24', quote: 'USD', requireVolume: false, isOvernight: false }

/** Position of a Quote field in the spec FEED_CONFIG acceptEventFields.Quote order */
const fieldIndex = (field: string): number => QUOTE_EVENT_FIELDS.Quote.indexOf(field)

/** The subscribed quote feed, wired exactly like the production transport */
const quoteFeed = () => {
  const feed = new DxLinkFeed({
    formatTickers: (params: any) => [{ symbol: String(params.base).toUpperCase(), type: 'Quote' }],
    processRecord: (eventType, record, params: any) =>
      eventType === 'Quote' ? quoteRecordToResult(record, params) : undefined,
  } as DxLinkFeedDeps<any>)
  // FEED_CONFIG first (the open gate hands the layout over), then the
  // subscription index (normally populated by the framework builder)
  feed.onFeedConfig(QUOTE_EVENT_FIELDS)
  feed.subscriptionMessages({ desired: [QUOTE_PARAMS], new: [QUOTE_PARAMS], stale: [] })
  return feed
}

describe('COMPACT FEED_DATA parsing (plan round1-compact-parsing / spec stock_quotes sample_response)', () => {
  it('a two-record Quote batch parses BOTH records positionally', () => {
    // Spec sample_response FEED_DATA frame: two 9-field Quote records
    // concatenated flat, fields in the FEED_CONFIG acceptEventFields order
    const records = parseCompactFeedData(
      'Quote',
      frames.stockQuotesFrame.data[1] as DxLinkRecord,
      QUOTE_EVENT_FIELDS,
    )

    expect(records).toHaveLength(2)
    for (const record of records) {
      expect(record).toHaveLength(QUOTE_EVENT_FIELDS.Quote.length)
    }

    // Record 1 read back through the negotiated field order (spec values verbatim)
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
    expect(records[1][fieldIndex('bidSize')]).toBe(50)
    expect(records[1][fieldIndex('askSize')]).toBe(80)
    expect(records[1][fieldIndex('bidExchangeCode')]).toBe('O')
    expect(records[1][fieldIndex('askExchangeCode')]).toBe('O')
  })

  it('a record whose bidPrice is the JSON string "NaN" is dropped as invalid (502, never a price)', () => {
    // Spec sample_response, second FEED_DATA frame: "NaN" bidPrice
    // (valueRangeScalingNotes: "NaN" is invalid)
    const results = quoteFeed().message(frames.stockQuotesInvalidFrame as any)

    expect(results).toHaveLength(1)
    const error = results[0] as any
    expect(error.statusCode).toBe(502)
    expect(error.errorMessage).toContain('invalid')
    expect(error.result).toBeUndefined()
    expect(error.data).toBeUndefined()
  })

  it('an ERROR frame surfaces a provider error at the handshake gate', async () => {
    // The error-mapping extension point: a provider ERROR before FEED_CONFIG
    // (e.g. unauthorized credentials) rejects the open gate with the provider's
    // message instead of silently opening the stream
    const sent: string[] = []
    const listeners = new Map<
      string,
      ((event: { data?: unknown; code?: number }) => void) | undefined
    >()
    const connection = {
      send: (data: string) => sent.push(data),
      addEventListener: (
        event: 'message' | 'close',
        listener: (event: { data?: unknown; code?: number }) => void,
      ) => {
        listeners.set(event, listener)
      },
      emit: (frame: unknown) => listeners.get('message')?.({ data: JSON.stringify(frame) }),
    }

    const opened = openDxLinkConnection(connection)
    listeners.get('message')?.({ data: JSON.stringify(frames.errorFrame) })

    await expect(opened).rejects.toThrow(frames.errorFrame.message)
  })

  it('in-stream ERROR, KEEPALIVE and CHANNEL_CLOSED frames produce no events (metrics-only alerting)', () => {
    // Owner decision degraded_stream_alerting=metrics_counters_only: control
    // frames are stream-control, never market data and never a hard error
    const feed = quoteFeed()
    for (const frame of [frames.errorFrame, frames.keepaliveFrame, frames.channelClosedFrame]) {
      expect(feed.message(frame as any)).toEqual([])
    }
  })

  it('a truncated final record is ignored: the complete record still parses, the torn tail does not', () => {
    // The spec sample frame's first record followed by a second record missing
    // its last 5 of 9 fields (a torn tail write)
    const frameWithTornTail = [
      ...frames.stockQuotesFrame.data[1].slice(0, QUOTE_EVENT_FIELDS.Quote.length),
      'Quote',
      'AAPL:USLF24',
      1760000002000,
      1,
    ] as DxLinkRecord

    const records = parseCompactFeedData('Quote', frameWithTornTail, QUOTE_EVENT_FIELDS)
    expect(records).toHaveLength(1)
    expect(records[0][fieldIndex('time')]).toBe(1760000000000)
    expect(records[0][fieldIndex('bidPrice')]).toBe(189.95)

    // The same frame through the message handler keeps only the complete
    // record's market data
    const feed = quoteFeed()
    const results = feed.message({
      type: 'FEED_DATA',
      channel: 1,
      data: ['Quote', frameWithTornTail],
    } as any)
    expect(results).toHaveLength(1)
    expect((results[0] as any).data.bid_price).toBe(189.95)
  })

  it('strips \\x00 padding from string fields so the wire symbol still maps', () => {
    const records = parseCompactFeedData(
      'Quote',
      [
        'Quote',
        'AAPL:USLF24\x00',
        1760000000000,
        189.95,
        190.05,
        100,
        200,
        'V',
        'V',
      ] as DxLinkRecord,
      QUOTE_EVENT_FIELDS,
    )

    expect(records).toHaveLength(1)
    expect(records[0][fieldIndex('eventSymbol')]).toBe('AAPL:USLF24')
  })

  it('Quote records map mid=(bid+ask)/2 and providerIndicatedTimeUnixMs=time per the spec response_mapping', () => {
    // Spec endpoint_request_response_examples[0]: mid_price 190.0,
    // providerIndicatedTimeUnixMs 1760000001000 for the newest sample record
    const results = quoteFeed().message(frames.stockQuotesFrame as any)

    expect(results).toHaveLength(1)
    const response = results[0] as any
    expect(response.result).toBe(190)
    expect(response.data.mid_price).toBe(190)
    expect(response.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000001000 })
  })
})
