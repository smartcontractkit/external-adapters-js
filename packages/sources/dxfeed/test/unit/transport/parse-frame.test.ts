import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { DxLinkFrame, parseCompactFeedData } from '../../../src/transport/ws'
import frames from '../fixtures/dxlink-frames.json'

// The transport modules log via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

/**
 * Plan round1-compact-parsing proving test (spec stock_quotes / price
 * sample_response): dxLink COMPACT FEED_DATA frames parse to field maps under
 * the FEED_CONFIG eventFields layout; the JSON string "NaN" marks the record
 * invalid; a truncated trailing record is dropped; KEEPALIVE and ERROR frames
 * produce no market data.
 *
 * Every value below is verbatim from the spec sample_response frames and the
 * FEED_CONFIG acceptEventFields lists — never from the implementation output.
 */
const QUOTE_FIELDS = frames.quoteFeedConfig.eventFields.Quote
const TRADE_FIELDS = frames.priceFeedConfig.eventFields.Trade

/** Zips the negotiated field names with one parsed COMPACT record into a field map */
const toFieldMap = (
  fields: string[],
  record: (string | number | boolean)[],
): Record<string, string | number | boolean> => {
  const map: Record<string, string | number | boolean> = {}
  fields.forEach((field, index) => {
    map[field] = record[index]
  })
  return map
}

describe('COMPACT FEED_DATA frame parsing (plan round1-compact-parsing / spec sample_response)', () => {
  it('parses the two concatenated Quote records of the spec sample frame into field maps under the FEED_CONFIG eventFields layout', () => {
    // Spec stock_quotes sample_response FEED_DATA frame: two 9-field Quote
    // records concatenated flat, fields in the FEED_CONFIG eventFields.Quote order
    const records = parseCompactFeedData(
      'Quote',
      frames.stockQuotesFrame.data[1] as (string | number | boolean)[],
      frames.quoteFeedConfig.eventFields,
    )

    expect(records).toHaveLength(2)
    // Spec record 1: time 1760000000000, bid 189.95/100, ask 190.05/200, V/V
    expect(toFieldMap(QUOTE_FIELDS, records[0])).toEqual({
      eventType: 'Quote',
      eventSymbol: 'AAPL:USLF24',
      time: 1760000000000,
      bidPrice: 189.95,
      askPrice: 190.05,
      bidSize: 100,
      askSize: 200,
      bidExchangeCode: 'V',
      askExchangeCode: 'V',
    })
    // Spec record 2: time 1760000001000, bid 189.90/50, ask 190.10/80, O/O —
    // distinct values at the same positions prove the split is positional
    expect(toFieldMap(QUOTE_FIELDS, records[1])).toEqual({
      eventType: 'Quote',
      eventSymbol: 'AAPL:USLF24',
      time: 1760000001000,
      bidPrice: 189.9,
      askPrice: 190.1,
      bidSize: 50,
      askSize: 80,
      bidExchangeCode: 'O',
      askExchangeCode: 'O',
    })
  })

  it('parses the spec Trade record into its field map under eventFields.Trade', () => {
    // Spec price sample_response FEED_DATA frame: one 12-field Trade record
    const records = parseCompactFeedData(
      'Trade',
      frames.priceTradeFrame.data[1] as (string | number | boolean)[],
      frames.priceFeedConfig.eventFields,
    )

    expect(records).toHaveLength(1)
    expect(toFieldMap(TRADE_FIELDS, records[0])).toEqual({
      eventType: 'Trade',
      eventSymbol: 'AAPL:USLF24',
      time: 1760000000000,
      price: 189.98,
      size: 10,
      sequence: 12345,
      exchangeCode: 'V',
      change: 0.12,
      dayVolume: 5000000,
      dayTurnover: 999000000,
      tickDirection: 'UP',
      extendedTradingHours: false,
    })
  })

  it('marks the JSON string "NaN" invalid at its field position (spec valueRangeScalingNotes)', () => {
    // Spec stock_quotes sample_response, second frame: bidPrice is the string "NaN"
    const records = parseCompactFeedData(
      'Quote',
      frames.stockQuotesInvalidFrame.data[1] as (string | number | boolean)[],
      frames.quoteFeedConfig.eventFields,
    )

    expect(records).toHaveLength(1)
    const map = toFieldMap(QUOTE_FIELDS, records[0])
    // The invalid marker lands exactly at the bidPrice position — every other
    // field keeps its spec value
    expect(Number.isNaN(map.bidPrice as number)).toBe(true)
    expect(map.eventSymbol).toBe('AAPL:USLF24')
    expect(map.time).toBe(1760000000000)
    expect(map.askPrice).toBe(190.05)
  })

  it('drops a truncated trailing record and keeps the complete one', () => {
    // The spec sample frame's first record followed by a second record missing
    // its last 5 of 9 fields (a torn tail write)
    const tornTail = [
      ...(frames.stockQuotesFrame.data[1] as (string | number | boolean)[]).slice(
        0,
        QUOTE_FIELDS.length,
      ),
      'Quote',
      'AAPL:USLF24',
      1760000002000,
      1,
    ]

    const records = parseCompactFeedData('Quote', tornTail, frames.quoteFeedConfig.eventFields)
    expect(records).toHaveLength(1)
    expect(toFieldMap(QUOTE_FIELDS, records[0]).time).toBe(1760000000000)
    expect(toFieldMap(QUOTE_FIELDS, records[0]).bidPrice).toBe(189.95)
  })

  it('narrows the DxLinkFrame discriminant to FEED_DATA before the data payload is read (spec stock_quotes sample frame)', () => {
    // The spec sample_response FEED_DATA frame typed as the parse-frame result
    const frame = frames.stockQuotesFrame as DxLinkFrame

    // Narrowing guard (plan round 2): ONLY the FEED_DATA variant of the
    // discriminated DxLinkFrame union carries `data` — reading `frame.data`
    // below compiles exactly because the guard excludes every control variant
    if (frame.type !== 'FEED_DATA') {
      throw new Error('expected FEED_DATA')
    }

    // Spec stock_quotes sample_response frame verbatim: eventType "Quote"
    // first, then the COMPACT record payload
    expect(frame.data[0]).toBe('Quote')
    expect(frame.data[1]).toEqual([
      'Quote',
      'AAPL:USLF24',
      1760000000000,
      189.95,
      190.05,
      100,
      200,
      'V',
      'V',
      'Quote',
      'AAPL:USLF24',
      1760000001000,
      189.9,
      190.1,
      50,
      80,
      'O',
      'O',
    ])
  })

  it('KEEPALIVE and ERROR frames are control messages: no COMPACT records and no market data', () => {
    // Both frames carry no FEED_DATA payload at all — they are stream-control
    // (exception dxlink-control-protocol) and must yield no records
    for (const frame of [frames.keepaliveFrame, frames.errorFrame] as DxLinkFrame[]) {
      expect(frame.type === 'KEEPALIVE' || frame.type === 'ERROR').toBe(true)
      // Narrowing guard (plan round 2): only the FEED_DATA variant of the
      // discriminated DxLinkFrame union carries `data`; a control frame that
      // somehow carried one fails loud here instead of being read
      if (frame.type === 'FEED_DATA') {
        throw new Error(`control frame ${frame.type} unexpectedly carried a FEED_DATA payload`)
      }
      // The narrowed non-FEED_DATA variants structurally have no `data` field —
      // exactly the spec's "KEEPALIVE and ERROR frames produce no market data"
      expect('data' in frame).toBe(false)
      // So the payload reaching the COMPACT parser for a control frame is empty
      expect(parseCompactFeedData('Quote', [], frames.quoteFeedConfig.eventFields)).toEqual([])
    }
  })
})
