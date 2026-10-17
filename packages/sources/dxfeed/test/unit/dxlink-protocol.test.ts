import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { DxLinkFeed, DxLinkFeedDeps, parseNumeric } from '../../src/dxlink/protocol'
import { quoteRecordToResult } from '../../src/transport/stock-quotes'
import frames from './fixtures/dxlink-frames.json'

LoggerFactoryProvider.set()

const PARAMS = { base: 'AAPL:USLF24', quote: 'USD', requireVolume: false, isOvernight: false }

/** A Quote feed wired exactly like the stock_quotes transport (spec overrides resolve upstream: params.base is the wire ticker). */
const specQuoteFeed = (): DxLinkFeed => {
  const feed = new DxLinkFeed({
    formatTickers: (params: { base: string }) => [
      { symbol: params.base.toUpperCase(), type: 'Quote' },
    ],
    processRecord: (_eventType, record, params) => quoteRecordToResult(record, params),
  } as DxLinkFeedDeps<any>)
  feed.onFeedConfig(frames.quoteFeedConfig.eventFields)
  feed.subscriptionMessages({ desired: [PARAMS], new: [PARAMS], stale: [] })
  return feed
}

describe('parseNumeric (spec valueRangeScalingNotes: values arrive as JSON numbers, or the JSON string "NaN" which is invalid)', () => {
  it('returns a JSON number unchanged', () => {
    expect(parseNumeric(190.05)).toBe(190.05)
    expect(parseNumeric(100)).toBe(100)
    expect(parseNumeric(0)).toBe(0)
  })

  it('returns NaN for a string-encoded number ("190.05") — no Number() coercion, a numeric string is a wire-shape regression', () => {
    expect(Number.isNaN(parseNumeric('190.05'))).toBe(true)
  })

  it('returns NaN for the "NaN" marker string (invalid)', () => {
    expect(Number.isNaN(parseNumeric('NaN'))).toBe(true)
  })
})

describe('COMPACT FEED_DATA frame with several records (spec stock_quotes sample_response concatenates two Quote records for AAPL:USLF24 in one frame)', () => {
  it('yields the values of the SECOND record per wire key — the spec example response maps the newest record of the sample frame', () => {
    // Spec endpoint_request_response_examples[0].response: mid_price 190.0,
    // bid 189.90/50, ask 190.10/80, providerIndicatedTimeUnixMs 1760000001000 —
    // the second record of the sample frame, not the first (189.95/100,
    // 190.05/200, t=1760000000000)
    const results = specQuoteFeed().message(frames.stockQuotesFrame)

    expect(results).toHaveLength(1)
    const result = results[0] as unknown as {
      result: number
      data: Record<string, number>
      timestamps: { providerIndicatedTimeUnixMs: number }
      params: { base: string }
    }
    expect(result.result).toBe(190.0)
    expect(result.data).toEqual({
      mid_price: 190.0,
      bid_price: 189.9,
      bid_volume: 50,
      ask_price: 190.1,
      ask_volume: 80,
    })
    expect(result.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000001000 })
    expect(result.params.base).toBe('AAPL:USLF24')
  })
})
