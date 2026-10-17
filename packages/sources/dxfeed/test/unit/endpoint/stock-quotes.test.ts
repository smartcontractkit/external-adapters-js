import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { quoteRecordToResult } from '../../../src/transport/stock-quotes'
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
  it('the spec sample Quote frame yields mid_price 190.0, bid 189.95/100, ask 190.05/200, providerIndicatedTimeUnixMs 1760000000000', () => {
    const results = quoteFeed().message(frames.stockQuotesFrame as any)

    expect(results).toHaveLength(1)
    const response = results[0] as any
    // Spec endpoint_request_response_examples[0].response
    expect(response.result).toBe(190.0)
    expect(response.data).toEqual({
      mid_price: 190.0,
      bid_price: 189.95,
      bid_volume: 100,
      ask_price: 190.05,
      ask_volume: 200,
    })
    // Spec stock_quotes data_freshness.timestamp_field = time
    expect(response.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
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
})
