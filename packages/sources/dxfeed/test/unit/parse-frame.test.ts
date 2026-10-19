import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { TradeProcessor } from '../../src/transport/price-ws'
import { quoteRecordToResult } from '../../src/transport/stock-quotes'
import {
  DxLinkFeed,
  DxLinkFeedDeps,
  DxLinkRecord,
  parseCompactFeedData,
} from '../../src/transport/ws'
import frames from './fixtures/dxlink-frames.json'

// The transport modules log via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

/**
 * Plan round1-compact-parsing proving test (spec stock_quotes sample_response):
 * dxLink FEED_DATA arrives in COMPACT format — the record fields are positional
 * and must be mapped with the FEED_SETUP acceptEventFields order the provider
 * negotiated in FEED_CONFIG.
 *
 * Every expectation below traces to the spec, never to the implementation:
 * - field positions come from the spec FEED_CONFIG acceptEventFields.Quote list
 * - record values come verbatim from the spec sample_response frames
 * - the mapped response comes from the spec response_mapping / response example
 */
const QUOTE_EVENT_FIELDS = frames.quoteFeedConfig.eventFields
const QUOTE_PARAMS = { base: 'AAPL:USLF24', quote: 'USD', requireVolume: false, isOvernight: false }
const TRADE_PARAMS = { base: 'AAPL:USLF24', quote: 'USD' }

/** Position of a Quote field in the spec FEED_CONFIG acceptEventFields.Quote order */
const fieldIndex = (field: string): number => QUOTE_EVENT_FIELDS.Quote.indexOf(field)

/** The subscribed quote feed, exactly as the production wiring builds it */
const quoteFeed = () => {
  const feed = new DxLinkFeed({
    formatTickers: (params: any) => [{ symbol: String(params.base).toUpperCase(), type: 'Quote' }],
    processRecord: (eventType, record, params: any) =>
      eventType === 'Quote' ? quoteRecordToResult(record, params) : undefined,
  } as DxLinkFeedDeps<any>)
  feed.onFeedConfig(QUOTE_EVENT_FIELDS)
  feed.subscriptionMessages({ desired: [QUOTE_PARAMS], new: [QUOTE_PARAMS], stale: [] })
  return feed
}

describe('COMPACT FEED_DATA frame parsing (plan round1-compact-parsing / spec stock_quotes sample_response)', () => {
  it('maps the spec sample frame positionally with the FEED_SETUP acceptEventFields order', () => {
    // Spec sample_response FEED_DATA: one frame, two concatenated 9-field Quote
    // records following the FEED_CONFIG field order
    const records = parseCompactFeedData(
      'Quote',
      frames.stockQuotesFrame.data[1] as DxLinkRecord,
      QUOTE_EVENT_FIELDS,
    )

    expect(records).toHaveLength(2)
    for (const record of records) {
      expect(record).toHaveLength(QUOTE_EVENT_FIELDS.Quote.length)
    }

    // Spec sample record 1, read back through the negotiated field order:
    // time=1760000000000, bidPrice=189.95, askPrice=190.05, bidSize=100, askSize=200
    expect(records[0][fieldIndex('eventSymbol')]).toBe('AAPL:USLF24')
    expect(records[0][fieldIndex('time')]).toBe(1760000000000)
    expect(records[0][fieldIndex('bidPrice')]).toBe(189.95)
    expect(records[0][fieldIndex('askPrice')]).toBe(190.05)
    expect(records[0][fieldIndex('bidSize')]).toBe(100)
    expect(records[0][fieldIndex('askSize')]).toBe(200)

    // Spec response_mapping: mid_price=(bidPrice+askPrice)/2, provider_timestamp=time.
    // These are the FIRST sample record's values (189.95/100, 190.05/200,
    // t=1760000000000). The spec endpoint_request_response_examples[0].response
    // instead shows the frame's SECOND (newest) record — bid 189.90/50,
    // ask 190.10/80, providerIndicatedTimeUnixMs 1760000001000 — asserted below.
    const mapped = quoteRecordToResult(records[0], QUOTE_PARAMS) as any
    expect(mapped.result).toBe(190)
    expect(mapped.data).toEqual({
      mid_price: 190,
      bid_price: 189.95,
      bid_volume: 100,
      ask_price: 190.05,
      ask_volume: 200,
    })
    expect(mapped.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })

    // Spec sample record 2 maps to its own distinct field values, proving the
    // positional split (time=1760000001000, 189.9/50 bid, 190.1/80 ask)
    const second = quoteRecordToResult(records[1], QUOTE_PARAMS) as any
    expect(second.data).toEqual({
      mid_price: 190,
      bid_price: 189.9,
      bid_volume: 50,
      ask_price: 190.1,
      ask_volume: 80,
    })
    expect(second.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000001000 })
  })

  it('a "NaN" bidPrice yields an invalid result, not a number (spec valueRangeScalingNotes)', () => {
    // Spec sample_response FEED_DATA frame 2: bidPrice is the JSON string "NaN"
    const records = parseCompactFeedData(
      'Quote',
      frames.stockQuotesInvalidFrame.data[1] as DxLinkRecord,
      QUOTE_EVENT_FIELDS,
    )

    expect(records).toHaveLength(1)
    // The "NaN" string maps to an invalid value at the bidPrice position...
    expect(Number.isNaN(records[0][fieldIndex('bidPrice')] as number)).toBe(true)

    // ...and the record is rejected as an error, never emitted as a number result
    const rejected = quoteRecordToResult(records[0], QUOTE_PARAMS) as any
    expect(rejected.statusCode).toBe(502)
    expect(rejected.errorMessage).toContain('invalid')
    expect(rejected.result).toBeUndefined()
    expect(rejected.data).toBeUndefined()
  })

  it('a trailing partial record is dropped without error', () => {
    // The spec sample frame plus a second record missing its last 5 of 9 fields
    // (a torn tail write): the complete record must survive, the partial must
    // not be misparsed, and nothing may throw
    const frameWithTornTail = [
      ...frames.stockQuotesFrame.data[1].slice(0, QUOTE_EVENT_FIELDS.Quote.length),
      'Quote',
      'AAPL:USLF24',
      1760000002000,
      1,
    ] as DxLinkRecord

    const parse = () => parseCompactFeedData('Quote', frameWithTornTail, QUOTE_EVENT_FIELDS)

    expect(parse).not.toThrow()

    const records = parse()
    expect(records).toHaveLength(1)
    expect(records[0][fieldIndex('time')]).toBe(1760000000000)
    expect(records[0][fieldIndex('bidPrice')]).toBe(189.95)

    // The same frame streamed through the message handler keeps only the
    // complete record's market data
    const feed = quoteFeed()
    const results = feed.message({
      type: 'FEED_DATA',
      channel: 1,
      data: ['Quote', frameWithTornTail],
    } as any)
    expect(results).toHaveLength(1)
    expect((results[0] as any).data.bid_price).toBe(189.95)
    expect((results[0] as any).timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
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

  it('ERROR, KEEPALIVE and CHANNEL_CLOSED control frames produce no market-data result', () => {
    const feed = quoteFeed()
    // All three dxLink control messages (exception dxlink-control-protocol) are
    // stream-control, never market data
    for (const frame of [frames.errorFrame, frames.keepaliveFrame, frames.channelClosedFrame]) {
      expect(feed.message(frame as any)).toEqual([])
    }
  })
})

describe('COMPACT Trade frame parsing (plan round1-compact-parsing / spec price sample_response)', () => {
  // The subscribed trade feed, wired exactly like the price endpoint transport
  const tradeFeed = () => {
    const processor = new TradeProcessor()
    const feed = new DxLinkFeed({
      formatTickers: (params: any) => [
        { symbol: String(params.base).toUpperCase(), type: 'Trade' },
      ],
      processRecord: (eventType, record, params: any) =>
        processor.processRecord(eventType, record, params),
    } as DxLinkFeedDeps<any>)
    feed.onFeedConfig(frames.priceFeedConfig.eventFields)
    feed.subscriptionMessages({ desired: [TRADE_PARAMS], new: [TRADE_PARAMS], stale: [] })
    return feed
  }

  it('maps the spec Trade record positionally with the FEED_SETUP acceptEventFields.Trade order', () => {
    // Spec price FEED_CONFIG acceptEventFields.Trade:
    // eventType,eventSymbol,time,price,size,sequence,exchangeCode,change,dayVolume,dayTurnover,tickDirection,extendedTradingHours
    const tradeFields = frames.priceFeedConfig.eventFields.Trade
    const records = parseCompactFeedData(
      'Trade',
      frames.priceTradeFrame.data[1] as DxLinkRecord,
      frames.priceFeedConfig.eventFields,
    )

    expect(records).toHaveLength(1)
    expect(records[0]).toHaveLength(tradeFields.length)
    expect(records[0][tradeFields.indexOf('eventSymbol')]).toBe('AAPL:USLF24')
    expect(records[0][tradeFields.indexOf('time')]).toBe(1760000000000)
    expect(records[0][tradeFields.indexOf('price')]).toBe(189.98)
    expect(records[0][tradeFields.indexOf('size')]).toBe(10)
    expect(records[0][tradeFields.indexOf('exchangeCode')]).toBe('V')

    // The parsed record flows to the subscriber params: the spec "stock"
    // endpoint example response — data.result 189.98 and
    // timestamps.providerIndicatedTimeUnixMs 1760000000000
    const out = tradeFeed().message(frames.priceTradeFrame as any)
    expect(out).toHaveLength(1)
    expect((out[0] as any).result).toBe(189.98)
    expect((out[0] as any).timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
  })
})

describe('merged: parse.test', () => {
  // The transport modules log via the framework logger, which needs a factory set
  LoggerFactoryProvider.set()

  /**
   * Plan item ROUND1-MESSAGE-PARSING proving test (test/unit/parse.test.ts).
   *
   * Every assertion traces to a spec line, never to the implementation output:
   * - the frames are the spec stock_quotes / price sample_response frames,
   *   stored verbatim in ./fixtures/dxlink-frames.json
   * - the field orders are the spec FEED_CONFIG acceptEventFields lists
   * - the mapped values are the spec response_mapping /
   *   endpoint_request_response_examples values
   */
  const QUOTE_EVENT_FIELDS = frames.quoteFeedConfig.eventFields
  const QUOTE_PARAMS = {
    base: 'AAPL:USLF24',
    quote: 'USD',
    requireVolume: false,
    isOvernight: false,
  }
  const TRADE_PARAMS = { base: 'AAPL:USLF24', quote: 'USD' }

  /** Position of a Quote field in the spec FEED_CONFIG acceptEventFields.Quote order */
  const fieldIndex = (field: string): number => QUOTE_EVENT_FIELDS.Quote.indexOf(field)

  /**
   * The subscribed quote feed, wired exactly as the production transport wires
   * it (real ticker mapper + real record mapper); the FEED_CONFIG layout is
   * handed over by the open gate, the subscription index is built by the
   * framework's customSubscriptionMessages call.
   */
  const quoteFeed = () => {
    const feed = new DxLinkFeed({
      formatTickers: (params: any) => [
        { symbol: String(params.base).toUpperCase(), type: 'Quote' },
      ],
      processRecord: (eventType, record, params: any) =>
        eventType === 'Quote' ? quoteRecordToResult(record, params) : undefined,
    } as DxLinkFeedDeps<any>)
    feed.onFeedConfig(QUOTE_EVENT_FIELDS)
    feed.subscriptionMessages({ desired: [QUOTE_PARAMS], new: [QUOTE_PARAMS], stale: [] })
    return feed
  }

  describe('spec sample_response frames parse (plan ROUND1-MESSAGE-PARSING: Quote and Trade)', () => {
    it('parses the spec Quote sample frame positionally under the FEED_CONFIG eventFields.Quote order', () => {
      // Spec stock_quotes sample_response FEED_DATA: two 9-field Quote records
      // concatenated flat in the FEED_CONFIG field order
      const records = parseCompactFeedData(
        'Quote',
        frames.stockQuotesFrame.data[1] as DxLinkRecord,
        QUOTE_EVENT_FIELDS,
      )

      expect(records).toHaveLength(2)
      for (const record of records) {
        expect(record).toHaveLength(QUOTE_EVENT_FIELDS.Quote.length)
      }

      // Spec record 1, read back through the negotiated field order
      expect(records[0][fieldIndex('eventSymbol')]).toBe('AAPL:USLF24')
      expect(records[0][fieldIndex('time')]).toBe(1760000000000)
      expect(records[0][fieldIndex('bidPrice')]).toBe(189.95)
      expect(records[0][fieldIndex('askPrice')]).toBe(190.05)
      expect(records[0][fieldIndex('bidSize')]).toBe(100)
      expect(records[0][fieldIndex('askSize')]).toBe(200)
      expect(records[0][fieldIndex('bidExchangeCode')]).toBe('V')

      // Spec record 2 carries distinct values at the same positions — the split
      // is positional, not a copy
      expect(records[1][fieldIndex('time')]).toBe(1760000001000)
      expect(records[1][fieldIndex('bidPrice')]).toBe(189.9)
      expect(records[1][fieldIndex('askPrice')]).toBe(190.1)
      expect(records[1][fieldIndex('bidSize')]).toBe(50)
      expect(records[1][fieldIndex('askSize')]).toBe(80)
      expect(records[1][fieldIndex('bidExchangeCode')]).toBe('O')
    })

    it('parses the spec Trade sample frame positionally under the FEED_CONFIG eventFields.Trade order', () => {
      // Spec price sample_response FEED_DATA: one 12-field Trade record
      const tradeFields = frames.priceFeedConfig.eventFields.Trade
      const records = parseCompactFeedData(
        'Trade',
        frames.priceTradeFrame.data[1] as DxLinkRecord,
        frames.priceFeedConfig.eventFields,
      )

      expect(records).toHaveLength(1)
      expect(records[0][tradeFields.indexOf('eventSymbol')]).toBe('AAPL:USLF24')
      expect(records[0][tradeFields.indexOf('time')]).toBe(1760000000000)
      expect(records[0][tradeFields.indexOf('price')]).toBe(189.98)
      expect(records[0][tradeFields.indexOf('size')]).toBe(10)
      expect(records[0][tradeFields.indexOf('exchangeCode')]).toBe('V')

      // The parsed record serves the spec price example response: result 189.98,
      // providerIndicatedTimeUnixMs 1760000000000
      const processor = new TradeProcessor()
      const out = processor.processRecord('Trade', records[0], TRADE_PARAMS as any) as any
      expect(out.result).toBe(189.98)
      expect(out.data).toEqual({ result: 189.98 })
    })
  })

  describe('"NaN" bidPrice yields an invalid record (spec valueRangeScalingNotes)', () => {
    it('maps the "NaN" string to invalid at the bidPrice position and rejects the record (502), never a price', () => {
      // Spec stock_quotes sample_response, second FEED_DATA frame
      const records = parseCompactFeedData(
        'Quote',
        frames.stockQuotesInvalidFrame.data[1] as DxLinkRecord,
        QUOTE_EVENT_FIELDS,
      )

      expect(records).toHaveLength(1)
      expect(Number.isNaN(records[0][fieldIndex('bidPrice')] as number)).toBe(true)

      const rejected = quoteRecordToResult(records[0], QUOTE_PARAMS) as any
      expect(rejected.statusCode).toBe(502)
      expect(rejected.errorMessage).toContain('invalid')
      expect(rejected.result).toBeUndefined()
      expect(rejected.data).toBeUndefined()
    })
  })

  describe('a truncated trailing record is dropped (torn COMPACT tail)', () => {
    it('keeps the complete record, drops the partial tail, and never throws', () => {
      // The spec sample frame's first record followed by a second record missing
      // its last 5 of 9 fields
      const frameWithTornTail = [
        ...frames.stockQuotesFrame.data[1].slice(0, QUOTE_EVENT_FIELDS.Quote.length),
        'Quote',
        'AAPL:USLF24',
        1760000002000,
        1,
      ] as DxLinkRecord

      const parse = () => parseCompactFeedData('Quote', frameWithTornTail, QUOTE_EVENT_FIELDS)
      expect(parse).not.toThrow()

      const records = parse()
      expect(records).toHaveLength(1)
      expect(records[0][fieldIndex('time')]).toBe(1760000000000)
      expect(records[0][fieldIndex('bidPrice')]).toBe(189.95)
    })
  })

  describe('\\x00 is stripped from string fields (wire padding)', () => {
    it('strips NUL padding so the wire symbol still maps', () => {
      const records = parseCompactFeedData(
        'Quote',
        ['Quote', 'AAPL:USLF24\x00', 1760000000000, 189.95, 190.05, 100, 200, 'V', 'V'],
        QUOTE_EVENT_FIELDS,
      )

      expect(records).toHaveLength(1)
      expect(records[0][fieldIndex('eventSymbol')]).toBe('AAPL:USLF24')
    })
  })

  describe('ERROR, KEEPALIVE and CHANNEL_CLOSED frames produce no data events (dxLink control protocol)', () => {
    it('each control frame maps to an empty result list — stream-control, never market data', () => {
      const feed = quoteFeed()
      for (const frame of [frames.errorFrame, frames.keepaliveFrame, frames.channelClosedFrame]) {
        expect(feed.message(frame as any)).toEqual([])
      }
    })
  })

  describe('providerIndicatedTimeUnixMs equals the event time field (spec data_freshness.timestamp_field = time)', () => {
    it('carries the Quote record time on the result, per record', () => {
      const records = parseCompactFeedData(
        'Quote',
        frames.stockQuotesFrame.data[1] as DxLinkRecord,
        QUOTE_EVENT_FIELDS,
      )

      for (const record of records) {
        const result = quoteRecordToResult(record, QUOTE_PARAMS) as any
        expect(result.timestamps).toEqual({
          providerIndicatedTimeUnixMs: record[fieldIndex('time')],
        })
      }
      // Spec sample values: record 1 -> 1760000000000, record 2 -> 1760000001000
      expect(records.map((r) => r[fieldIndex('time')])).toEqual([1760000000000, 1760000001000])
    })

    it('carries the Trade record time on the price result', () => {
      const out = new TradeProcessor().processRecord(
        'Trade',
        frames.priceTradeFrame.data[1] as DxLinkRecord,
        TRADE_PARAMS as any,
      ) as any
      expect(out.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
    })
  })
})
