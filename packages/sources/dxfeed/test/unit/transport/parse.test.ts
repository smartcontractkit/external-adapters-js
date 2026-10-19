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

describe('merged: dxlink-ws-parse.test', () => {
  // The transport module logs via the framework logger, which needs a factory set
  LoggerFactoryProvider.set()

  /**
   * Plan item 4 proving test, driven by the spec stock_quotes sample_response
   * frames (template transport-ws-subscribe parse-frame + error-mapping
   * extension points; exception dxlink-control-protocol): the COMPACT FEED_DATA
   * records parse positionally against the FEED_CONFIG field layout, the JSON
   * string "NaN" marks a value invalid, an ERROR frame surfaces the provider
   * error, KEEPALIVE yields no update, and a frame with a trailing partial
   * record parses the complete prefix only.
   */
  const QUOTE_EVENT_FIELDS = frames.quoteFeedConfig.eventFields
  const QUOTE_PARAMS = {
    base: 'AAPL:USLF24',
    quote: 'USD',
    requireVolume: false,
    isOvernight: false,
  }

  /** Position of a Quote field in the spec FEED_CONFIG eventFields.Quote order */
  const fieldIndex = (field: string): number => QUOTE_EVENT_FIELDS.Quote.indexOf(field)

  /** The subscribed quote feed, wired exactly like the production transport */
  const quoteFeed = () => {
    const feed = new DxLinkFeed({
      formatTickers: (params: any) => [
        { symbol: String(params.base).toUpperCase(), type: 'Quote' },
      ],
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

  describe('COMPACT Quote record mapping (spec sample_response FEED_CONFIG + FEED_DATA; response_mapping)', () => {
    it('maps each COMPACT record positionally to eventSymbol/time/bid/ask/sizes/exchange codes', () => {
      // Spec sample_response frame: two 9-field Quote records concatenated flat
      // in the FEED_CONFIG eventFields.Quote order
      const records = parseCompactFeedData(
        'Quote',
        frames.stockQuotesFrame.data[1] as DxLinkRecord,
        QUOTE_EVENT_FIELDS,
      )

      expect(records).toHaveLength(2)
      // Spec response_mapping: symbol=eventSymbol, bid_price=bidPrice,
      // bid_volume=bidSize, bid_exchange=bidExchangeCode, ask_price=askPrice,
      // ask_volume=askSize, ask_exchange=askExchangeCode, provider_timestamp=time
      for (const [i, values] of [
        {
          symbol: 'AAPL:USLF24',
          time: 1760000000000,
          bidPrice: 189.95,
          askPrice: 190.05,
          bidSize: 100,
          askSize: 200,
          bidExchange: 'V',
          askExchange: 'V',
        },
        {
          symbol: 'AAPL:USLF24',
          time: 1760000001000,
          bidPrice: 189.9,
          askPrice: 190.1,
          bidSize: 50,
          askSize: 80,
          bidExchange: 'O',
          askExchange: 'O',
        },
      ].entries()) {
        expect(records[i][fieldIndex('eventSymbol')]).toBe(values.symbol)
        expect(records[i][fieldIndex('time')]).toBe(values.time)
        expect(records[i][fieldIndex('bidPrice')]).toBe(values.bidPrice)
        expect(records[i][fieldIndex('askPrice')]).toBe(values.askPrice)
        expect(records[i][fieldIndex('bidSize')]).toBe(values.bidSize)
        expect(records[i][fieldIndex('askSize')]).toBe(values.askSize)
        expect(records[i][fieldIndex('bidExchangeCode')]).toBe(values.bidExchange)
        expect(records[i][fieldIndex('askExchangeCode')]).toBe(values.askExchange)
      }
    })

    it('maps the freshest record of the spec sample frame to the stock_quotes result shape', () => {
      // response_mapping: mid_price=(bidPrice+askPrice)/2; the spec request/
      // response example pins mid 190.0 and providerIndicatedTimeUnixMs
      // 1760000001000 for this frame
      const results = quoteFeed().message(frames.stockQuotesFrame as any)
      expect(results).toHaveLength(1)
      expect(results[0]).toMatchObject({
        result: 190.0,
        data: {
          mid_price: 190.0,
          bid_price: 189.9,
          bid_volume: 50,
          ask_price: 190.1,
          ask_volume: 80,
        },
        timestamps: { providerIndicatedTimeUnixMs: 1760000001000 },
      })
    })
  })

  describe('"NaN" marks a record invalid (spec valueRangeScalingNotes: the JSON string "NaN" is invalid)', () => {
    it('a "NaN" bidPrice yields the invalid result instead of a quote', () => {
      // Spec sample_response, second FEED_DATA frame
      const results = quoteFeed().message(frames.stockQuotesInvalidFrame as any)
      expect(results).toHaveLength(1)
      expect(results[0].statusCode).toBe(502)
      expect(results[0].errorMessage).toContain('invalid')
      expect(results[0].result).toBeUndefined()
      expect(results[0].data).toBeUndefined()
    })
  })

  describe('control frames (exception dxlink-control-protocol; owner decision degraded_stream_alerting=metrics_counters_only)', () => {
    it('an ERROR frame during the handshake surfaces the provider error', async () => {
      // Template error-mapping extension point: the provider's ERROR frame (e.g.
      // unauthorized credentials) rejects the open gate with the provider message
      const connection = {
        send: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }
      const opened = openDxLinkConnection(connection as any)

      connection.addEventListener.mock.calls.find(([event]: string[]) => event === 'message')![1]({
        data: JSON.stringify(frames.errorFrame),
      })
      await expect(opened).rejects.toThrow(/Unauthorized/)
    })

    it('a KEEPALIVE frame yields no update', () => {
      // Spec keepalive: KEEPALIVE frames keep the link alive and carry no data
      expect(quoteFeed().message(frames.keepaliveFrame as any)).toEqual([])
    })

    it('a post-handshake ERROR frame yields no data update (metrics-counters-only alerting)', () => {
      expect(quoteFeed().message(frames.errorFrame as any)).toEqual([])
    })
  })

  describe('trailing partial record (acceptAggregationPeriod=1 concatenates records; a torn tail must not misparse)', () => {
    it('parses the complete prefix only', () => {
      // The spec sample frame's first (complete) 9-field record followed by a
      // second record missing its last 5 of 9 fields
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
      expect(records[0][fieldIndex('askPrice')]).toBe(190.05)

      // Through the message handler the torn tail surfaces no second result
      const results = quoteFeed().message({
        type: 'FEED_DATA',
        channel: 1,
        data: ['Quote', frameWithPartialTail],
      } as any)
      expect(results).toHaveLength(1)
      expect((results[0] as any).data.bid_price).toBe(189.95)
    })
  })
})
