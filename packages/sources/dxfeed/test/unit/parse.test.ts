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
const QUOTE_PARAMS = { base: 'AAPL:USLF24', quote: 'USD', requireVolume: false, isOvernight: false }
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
    formatTickers: (params: any) => [{ symbol: String(params.base).toUpperCase(), type: 'Quote' }],
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
