import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { quoteRecordToResult, quoteTickers } from '../../../src/transport/stock-quotes'
import { DxLinkFeed, DxLinkFeedDeps } from '../../../src/transport/ws'
import frames from '../fixtures/dxlink-frames.json'

LoggerFactoryProvider.set()

const PARAMS = { base: 'AAPL:USLF24', quote: 'USD', requireVolume: false, isOvernight: false }

const quoteFeed = () => {
  const feed = new DxLinkFeed({
    formatTickers: (params: any) => [{ symbol: String(params.base).toUpperCase(), type: 'Quote' }],
    processRecord: (eventType, record, params: any) =>
      eventType === 'Quote' ? quoteRecordToResult(record, params) : undefined,
  } as DxLinkFeedDeps<any>)
  feed.onFeedConfig(frames.quoteFeedConfig.eventFields)
  feed.subscriptionMessages({ desired: [PARAMS], new: [PARAMS], stale: [] })
  return feed
}

describe('stock_quotes over dxLink (spec data_source_endpoints.stock_quotes)', () => {
  it('the spec sample Quote frame yields mid_price 190.0 with the newest record of the frame: bid 189.90/50, ask 190.10/80, providerIndicatedTimeUnixMs 1760000001000', () => {
    const results = quoteFeed().message(frames.stockQuotesFrame as any)

    expect(results).toHaveLength(1)
    const response = results[0] as any
    // The spec sample frame concatenates two records for the same wire key;
    // the LAST one wins (the freshest quote with acceptAggregationPeriod=1).
    expect(response.result).toBe(190.0)
    expect(response.data).toEqual({
      mid_price: 190.0,
      bid_price: 189.9,
      bid_volume: 50,
      ask_price: 190.1,
      ask_volume: 80,
    })
    // Spec stock_quotes data_freshness.timestamp_field = time
    expect(response.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000001000 })
  })

  it('requireVolume=true: an invalid ("NaN") volume returns an error, not a zero', () => {
    const nanVolumeRecord = [
      'Quote',
      'AAPL:USLF24',
      1760000000000,
      189.95,
      190.05,
      'NaN',
      200,
      'V',
      'V',
    ]

    const error = quoteRecordToResult(nanVolumeRecord, { ...PARAMS, requireVolume: true }) as any
    expect(error.statusCode).toBe(502)
    expect(error.errorMessage).toContain('invalid')

    // Without requireVolume the invalid volume passes through unchanged (NaN —
    // null on the wire; plan round-2 item 1) and the quote stays valid
    const ok = quoteRecordToResult(nanVolumeRecord, PARAMS) as any
    expect(ok.statusCode).toBeUndefined()
    expect(ok.data.bid_volume).toBeNaN()
    expect(ok.data.ask_volume).toBe(200)
    expect(ok.data.mid_price).toBe(190.0)
  })

  it('mids a one-sided book against the live side (spec response_mapping mid_price = (bidPrice + askPrice) / 2; the dead side quotes 0)', () => {
    // Bid-only book: bid 189.90 live, ask 0 dead -> mid = bid
    const bidOnlyRecord = ['Quote', 'AAPL:USLF24', 1760000000000, 189.9, 0, 50, 0, 'O', 'O']
    const bidSide = quoteRecordToResult(bidOnlyRecord, PARAMS) as any
    expect(bidSide.data.mid_price).toBe(189.9)
    expect(bidSide.data.bid_price).toBe(189.9)
    expect(bidSide.data.ask_price).toBe(0)
    expect(bidSide.result).toBe(189.9)

    // Ask-only book: ask 190.10 live, bid 0 dead -> mid = ask
    const askOnlyRecord = ['Quote', 'AAPL:USLF24', 1760000000000, 0, 190.1, 0, 80, 'O', 'O']
    const askSide = quoteRecordToResult(askOnlyRecord, PARAMS) as any
    expect(askSide.data.mid_price).toBe(190.1)
    expect(askSide.data.bid_price).toBe(0)
    expect(askSide.data.ask_price).toBe(190.1)
    expect(askSide.result).toBe(190.1)
  })

  it("isOvernight=true: rejects a Quote with bidExchangeCode 'V', accepts 'O'/'O', and tolerates the parameter's absence", () => {
    const overnightRecord = [
      'Quote',
      'AAPL:USLF24',
      1760000000000,
      189.95,
      190.05,
      100,
      200,
      'O',
      'O',
    ]

    // Blue Ocean on both sides: accepted
    expect(quoteRecordToResult(overnightRecord, { ...PARAMS, isOvernight: true })).toBeDefined()

    // The spec sample record quotes on 'V' on both sides: rejected
    expect(
      quoteRecordToResult(frames.stockQuotesFrame.data[1].slice(0, 9), {
        ...PARAMS,
        isOvernight: true,
      }),
    ).toBeUndefined()

    // RDD: 74 Overnight streams omit isOvernight — absence keeps any-venue records
    expect(
      quoteRecordToResult(frames.stockQuotesFrame.data[1].slice(0, 9), {
        base: 'AAPL:USLF24',
        quote: 'USD',
        requireVolume: false,
      } as any),
    ).toBeDefined()
  })

  it('subscribes the post-override ticker, suffixes passing through as given (spec base description: overrides.dxfeed resolves AAPL to AAPL:USLF24)', () => {
    // The framework applies the spec example request's overrides.dxfeed
    // ({AAPL: 'AAPL:USLF24'}) before the transport sees params; the transport
    // then subscribes the resolved DP ticker upper-cased, suffix intact
    expect(quoteTickers('AAPL:USLF24')).toEqual([{ symbol: 'AAPL:USLF24', type: 'Quote' }])

    // Suffixes pass through as given (:OCEA, :XNYM), case-normalised
    expect(quoteTickers('cl:ocea')).toEqual([{ symbol: 'CL:OCEA', type: 'Quote' }])
    expect(quoteTickers('cl:xnym')).toEqual([{ symbol: 'CL:XNYM', type: 'Quote' }])
  })
})
