import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { quoteRecordToResult } from '../../../src/transport/stock-quotes'
import { assertAcceptedEventFields, DxLinkFeed, DxLinkFeedDeps } from '../../../src/transport/ws'
import frames from '../fixtures/dxlink-frames.json'

LoggerFactoryProvider.set()

// Spec stock_quotes sample_response FEED_CONFIG defines the COMPACT record
// layout; the time field's position in it is protocol-defined
const QUOTE_FIELDS = frames.quoteFeedConfig.eventFields.Quote
const TIME_INDEX = QUOTE_FIELDS.indexOf('time')
const PARAMS = { base: 'AAPL:USLF24', quote: 'USD', requireVolume: false, isOvernight: false }

const quoteFeed = (params: typeof PARAMS = PARAMS) => {
  const feed = new DxLinkFeed({
    formatTickers: (params: any) => [{ symbol: String(params.base).toUpperCase(), type: 'Quote' }],
    processRecord: (eventType, record, params: any) =>
      eventType === 'Quote' ? quoteRecordToResult(record, params) : undefined,
  } as DxLinkFeedDeps<any>)
  // FEED_CONFIG field order first (the open gate hands this over), then the
  // subscription index (normally populated by the custom builder)
  feed.onFeedConfig(frames.quoteFeedConfig.eventFields)
  feed.subscriptionMessages({ desired: [params], new: [params], stale: [] })
  return feed
}

describe('Quote providerIndicatedTimeUnixMs (spec data_freshness.timestamp_field = time)', () => {
  it('maps the Quote record time field from the COMPACT frame fixture, not a bid/ask/volume position', () => {
    // First record of the spec sample frame, one field per FEED_CONFIG entry
    const record = (frames.stockQuotesFrame.data[1] as unknown[]).slice(0, QUOTE_FIELDS.length) as (
      | string
      | number
      | boolean
    )[]

    const response = quoteRecordToResult(record, PARAMS) as any

    // The freshness timestamp is exactly the record's time field value
    expect(response.timestamps.providerIndicatedTimeUnixMs).toBe(record[TIME_INDEX])
    // Spec sample first record: time=1760000000000
    expect(response.timestamps.providerIndicatedTimeUnixMs).toBe(1760000000000)
  })

  it('serves the NEWEST record of an aggregated frame: the last record per wire key wins, mid and timestamp alike', () => {
    // The spec sample frame concatenates two records for one wire key: the
    // first carries time=1760000000000 (bid 189.95/100, ask 190.05/200), the
    // second time=1760000001000 (bid 189.90/50, ask 190.10/80). With
    // acceptAggregationPeriod=1 the newest record in the frame is the freshest
    // quote, so the LAST record's mid and time field are served
    const results = quoteFeed().message(frames.stockQuotesFrame as any)

    expect(results).toHaveLength(1)
    expect((results[0] as any).data).toEqual({
      mid_price: 190,
      bid_price: 189.9,
      bid_volume: 50,
      ask_price: 190.1,
      ask_volume: 80,
    })
    expect((results[0] as any).timestamps.providerIndicatedTimeUnixMs).toBe(1760000001000)
    expect((results[0] as any).timestamps.providerIndicatedTimeUnixMs).not.toBe(1760000000000)
  })
})

describe('FEED_CONFIG eventFields order guard (round-2 item 3: fixed COMPACT indices must match the negotiated layout)', () => {
  // Same fields as the spec sample FEED_CONFIG but with askPrice ahead of
  // bidPrice — a divergent accepted order would silently misread every field
  const REORDERED_QUOTE_FIELDS = [
    'eventType',
    'eventSymbol',
    'time',
    'askPrice',
    'bidPrice',
    'bidSize',
    'askSize',
    'bidExchangeCode',
    'askExchangeCode',
  ]

  it('raises the assertion error when the accepted Quote field order diverges from the requested acceptEventFields', () => {
    expect(() => assertAcceptedEventFields({ Quote: REORDERED_QUOTE_FIELDS })).toThrow(/diverge/)
  })

  it('accepts the requested (spec sample_response) Quote field order', () => {
    expect(() => assertAcceptedEventFields({ Quote: QUOTE_FIELDS })).not.toThrow()
  })

  it('a reordered FEED_CONFIG fails the channel: a later FEED_DATA frame parses no records', () => {
    const feed = new DxLinkFeed({
      formatTickers: (params: any) => [
        { symbol: String(params.base).toUpperCase(), type: 'Quote' },
      ],
      processRecord: (eventType, record, params: any) =>
        eventType === 'Quote' ? quoteRecordToResult(record, params) : undefined,
    } as DxLinkFeedDeps<any>)

    // The divergent FEED_CONFIG arrives on the wire: no throw, no results...
    expect(
      feed.message({
        type: 'FEED_CONFIG',
        channel: 1,
        eventFields: { Quote: REORDERED_QUOTE_FIELDS },
      } as any),
    ).toEqual([])

    feed.subscriptionMessages({ desired: [PARAMS], new: [PARAMS], stale: [] })

    // ...and the channel is failed: the spec sample frame is NOT misread at the
    // wrong indices (bidPrice/askPrice swapped would map 189.95 to ask_price)
    expect(feed.message(frames.stockQuotesFrame as any)).toEqual([])
  })

  it('the verified order parses bid/ask price, size, time and exchange codes at their fixed indices', () => {
    // Exchange codes sit at the last two positions: with isOvernight=true the
    // record is kept only when BOTH sides quote on 'O' (Blue Ocean) — proof the
    // codes are read at their verified indices, not defaulted
    const overnightRecord = quoteRecordToResult(
      ['Quote', 'AAPL:USLF24', 1760000000000, 189.95, 190.05, 100, 200, 'O', 'O'],
      { ...PARAMS, isOvernight: true },
    ) as any
    // Spec response_mapping over the first sample record's values
    // (189.95/100, 190.05/200, t=1760000000000); the spec
    // endpoint_request_response_examples[0].response shows the frame's SECOND
    // (newest) record instead — bid 189.90/50, ask 190.10/80, t=1760000001000
    expect(overnightRecord.data).toEqual({
      mid_price: 190,
      bid_price: 189.95,
      bid_volume: 100,
      ask_price: 190.05,
      ask_volume: 200,
    })
    expect(overnightRecord.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })

    // Same record with regular-venue codes on both sides: dropped
    expect(
      quoteRecordToResult(
        ['Quote', 'AAPL:USLF24', 1760000000000, 189.95, 190.05, 100, 200, 'V', 'V'],
        { ...PARAMS, isOvernight: true },
      ),
    ).toBeUndefined()
  })
})

describe('Quote guard order (isOvernight exchange-code drop precedes the requireVolume 502; NaN price check is first)', () => {
  // Spec stock_quotes sample record layout; volumes are the JSON string "NaN"
  // (invalid per valueRangeScalingNotes), exchange codes vary per test
  const nanVolumeFrame = (bidExchangeCode: string, askExchangeCode: string) => ({
    type: 'FEED_DATA',
    channel: 1,
    data: [
      'Quote',
      [
        'Quote',
        'AAPL:USLF24',
        1760000000000,
        189.95,
        190.05,
        'NaN',
        'NaN',
        bidExchangeCode,
        askExchangeCode,
      ],
    ],
  })
  const OVERNIGHT_PARAMS = { ...PARAMS, requireVolume: true, isOvernight: true }

  it('drops a non-overnight-venue record before volume validation: invalid volumes emit no result and no 502', () => {
    const feed = quoteFeed(OVERNIGHT_PARAMS)

    // Both sides quote on 'V' (not the overnight venue 'O'): the record is
    // dropped by the isOvernight filter BEFORE the requireVolume check runs —
    // an invalid volume on a non-'O' venue must NOT surface a 502
    expect(feed.message(nanVolumeFrame('V', 'V') as any)).toEqual([])

    // Same semantics at the record mapper, the seam the FEED_DATA fan-out calls
    expect(
      quoteRecordToResult(
        ['Quote', 'AAPL:USLF24', 1760000000000, 189.95, 190.05, 'NaN', 'NaN', 'V', 'V'],
        OVERNIGHT_PARAMS,
      ),
    ).toBeUndefined()
  })

  it('an overnight-venue (O/O) record with invalid volumes still errors 502 under requireVolume', () => {
    const feed = quoteFeed(OVERNIGHT_PARAMS)

    // Both sides on 'O': the isOvernight filter keeps the record, so the
    // requireVolume check runs and emits the error result
    const results = feed.message(nanVolumeFrame('O', 'O') as any)

    expect(results).toHaveLength(1)
    const result = results[0] as any
    expect(result.statusCode).toBe(502)
    expect(result.errorMessage).toMatch(/[Vv]olume/)
    expect(result.result).toBeUndefined()
    expect(result.data).toBeUndefined()
    // The record's own time rides the 502 (price-ws TradeProcessor error branch
    // shape): downstream freshness reporting keeps the provider timestamp
    expect(result.timestamps.providerIndicatedTimeUnixMs).toBe(1760000000000)
  })

  it('a NaN price errors (502) regardless of the param combo — including isOvernight records a non-O venue would otherwise drop', () => {
    // Spec stock_quotes sample_response, second FEED_DATA frame: "NaN" bidPrice.
    // The price check runs FIRST, ahead of the isOvernight drop and the
    // requireVolume check, so every param combo surfaces the 502 — it is never
    // silently swallowed by the overnight record drop
    const nanPriceRecord = [
      'Quote',
      'AAPL:USLF24',
      1760000000000,
      'NaN',
      190.05,
      100,
      200,
      'V',
      'V',
    ] as (string | number)[]

    for (const requireVolume of [false, true]) {
      for (const isOvernight of [false, true]) {
        const result = quoteRecordToResult(nanPriceRecord, {
          ...PARAMS,
          requireVolume,
          isOvernight,
        }) as any
        expect(result).not.toBeUndefined()
        expect(result.statusCode).toBe(502)
        expect(result.errorMessage).toMatch(/[Pp]rice/)
        expect(result.result).toBeUndefined()
        // The record's own time rides the 502 (price-ws TradeProcessor error
        // branch shape): downstream freshness reporting keeps the provider
        // timestamp
        expect(result.timestamps.providerIndicatedTimeUnixMs).toBe(1760000000000)
      }
    }
  })
})

describe('zero / NaN outcome table (round-2: the 502-versus-result decision for zero, NaN and one-sided books must match the legacy dxfeed stock_quotes transport bit for bit)', () => {
  // Spec stock_quotes COMPACT record layout: bidPrice index 3, askPrice index 4
  const record = (bidPrice: number | string, askPrice: number | string) => [
    'Quote',
    'AAPL:USLF24',
    1760000000000,
    bidPrice,
    askPrice,
    100,
    200,
    'V',
    'V',
  ]

  const expectServedWithMid = (
    bidPrice: number | string,
    askPrice: number | string,
    mid: number,
  ) => {
    const result = quoteRecordToResult(record(bidPrice, askPrice), PARAMS) as any
    expect(result.statusCode).toBeUndefined()
    expect(result.errorMessage).toBeUndefined()
    expect(result.result).toBe(mid)
    expect(result.data.mid_price).toBe(mid)
  }

  const expectRejected502 = (bidPrice: number | string, askPrice: number | string) => {
    const result = quoteRecordToResult(record(bidPrice, askPrice), PARAMS) as any
    expect(result.statusCode).toBe(502)
    expect(result.errorMessage).toMatch(/[Pp]rice/)
    expect(result.result).toBeUndefined()
  }

  it('bid=0 one-sided book: mid against the live ask side (legacy bidPrice == 0 branch)', () => {
    expectServedWithMid(0, 190.05, 190.05)
  })

  it('ask=0 one-sided book: mid against the live bid side (legacy askPrice == 0 branch)', () => {
    expectServedWithMid(189.95, 0, 189.95)
  })

  it('both sides zero: served with mid 0, NOT a 502 (legacy bidPrice == 0 branch wins)', () => {
    expectServedWithMid(0, 0, 0)
  })

  it('bid=NaN: rejected 502 like the legacy invalid-price branch', () => {
    expectRejected502('NaN', 190.05)
  })

  it('ask=NaN: rejected 502 like the legacy invalid-price branch', () => {
    expectRejected502(189.95, 'NaN')
  })

  it('both NaN: rejected 502 like the legacy invalid-price branch', () => {
    expectRejected502('NaN', 'NaN')
  })
})
