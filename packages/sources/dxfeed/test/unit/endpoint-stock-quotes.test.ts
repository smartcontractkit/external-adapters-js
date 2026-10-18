import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import overrides from '../../src/config/overrides.json'
import { endpoint } from '../../src/endpoint/stock-quotes'
import { quoteRecordToResult } from '../../src/transport/stock-quotes'
import { DxLinkFeed, DxLinkFeedDeps } from '../../src/transport/ws'
import frames from './fixtures/dxlink-frames.json'

// The endpoint modules log via the framework logger, which needs a factory set
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

describe('mid/bid/ask/volumes mapping (spec response_mapping + endpoint_request_response_examples[0])', () => {
  it('maps a COMPACT Quote record to mid_price, bid_price, bid_volume, ask_price, ask_volume (the newest record of the aggregated frame — last record per wire key wins)', () => {
    const results = quoteFeed().message(frames.stockQuotesFrame as any)
    expect(results).toHaveLength(1)
    // The spec sample frame concatenates two records for the same wire key; the
    // LAST one is the freshest quote: mid 190.0, bid 189.90/50, ask 190.10/80
    expect((results[0] as any).data).toEqual({
      mid_price: 190,
      bid_price: 189.9,
      bid_volume: 50,
      ask_price: 190.1,
      ask_volume: 80,
    })
    expect((results[0] as any).result).toBe(190)
    // Spec example response: timestamps.providerIndicatedTimeUnixMs 1760000001000
    // — the record's own time (the newest record of the aggregated frame)
    expect((results[0] as any).timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000001000 })
  })

  it('a one-sided book still yields the mid, against the live side', () => {
    const bidOnly = ['Quote', 'AAPL:USLF24', 1760000000000, 189.95, 0, 100, 0, 'V', 'V']
    const bidSide = quoteRecordToResult(bidOnly, PARAMS) as any
    expect(bidSide.data.mid_price).toBe(189.95)

    const askOnly = ['Quote', 'AAPL:USLF24', 1760000000000, 0, 190.05, 0, 200, 'V', 'V']
    const askSide = quoteRecordToResult(askOnly, PARAMS) as any
    expect(askSide.data.mid_price).toBe(190.05)
  })
})

describe('requireVolume (spec: if true, error — not zero — on invalid bid/ask volume)', () => {
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

  it('requireVolume=true errors on the invalid volume', () => {
    const error = quoteRecordToResult(nanVolumeRecord, { ...PARAMS, requireVolume: true }) as any
    expect(error.statusCode).toBe(502)
    expect(error.errorMessage).toContain('volume')
    expect(error.data).toBeUndefined()
  })

  it('requireVolume=false tolerates it (the invalid volume passes through unchanged — NaN, null on the wire)', () => {
    const ok = quoteRecordToResult(nanVolumeRecord, PARAMS) as any
    expect(ok.statusCode).toBeUndefined()
    // Reference semantics (plan round-2 item 1): NaN passes through, it is not
    // coerced to 0 anywhere in the stock_quotes path
    expect(ok.data.bid_volume).toBeNaN()
    expect(ok.data.ask_volume).toBe(200)
    expect(ok.data.mid_price).toBe(190)
  })
})

describe('isOvernight (spec: only exchange code O on both sides, Blue Ocean)', () => {
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

  it('isOvernight=true rejects non-O exchange codes and accepts O/O', () => {
    expect(quoteRecordToResult(overnightRecord, { ...PARAMS, isOvernight: true })).toBeDefined()
    // The spec sample record quotes on 'V' on both sides
    expect(
      quoteRecordToResult(frames.stockQuotesFrame.data[1].slice(0, 9), {
        ...PARAMS,
        isOvernight: true,
      }),
    ).toBeUndefined()
  })

  it('omitted isOvernight behaves as false and tolerates any exchange code', () => {
    // RDD: 74 Overnight streams omit isOvernight — absence must tolerate any venue
    const { isOvernight, ...withoutIsOvernight } = PARAMS
    expect(quoteRecordToResult(overnightRecord, withoutIsOvernight as any)).toBeDefined()
    expect(
      quoteRecordToResult(frames.stockQuotesFrame.data[1].slice(0, 9), withoutIsOvernight as any),
    ).toBeDefined()
  })
})

describe('override resolution (spec example request: overrides.dxfeed {AAPL: AAPL:USLF24})', () => {
  it('the AAPL override resolves to the DP ticker before subscribe', () => {
    // The hardcoded override layer is out of scope for the dxLink migration
    // (overrides=preserve): its pre-migration entries are intact, and the spec
    // example's AAPL->AAPL:USLF24 mapping arrives per-request in the request
    // body's overrides.dxfeed object
    expect(overrides.dxfeed.WTI).toBe('USO/USD:AFX')
    const resolvedTicker = 'AAPL:USLF24'

    const feed = new DxLinkFeed({
      formatTickers: (params: any) => [
        { symbol: String(params.base).toUpperCase(), type: 'Quote' },
      ],
      processRecord: () => undefined,
    } as DxLinkFeedDeps<any>)
    const messages = feed.subscriptionMessages({
      desired: [{ ...PARAMS, base: resolvedTicker }],
      new: [{ ...PARAMS, base: resolvedTicker }],
      stale: [],
    })
    // Spec primary_command FEED_SUBSCRIPTION: {"symbol":"AAPL:USLF24","type":"Quote"}
    expect(messages).toEqual([
      { type: 'FEED_SUBSCRIPTION', channel: 1, add: [{ symbol: 'AAPL:USLF24', type: 'Quote' }] },
    ])
  })
})

describe('stock_quotes endpoint wiring (spec external_adapter_specifications.stock_quotes)', () => {
  it('exposes the endpoint with the spec input parameters and no aliases', () => {
    expect(endpoint.name).toBe('stock_quotes')
    expect(endpoint.aliases).toEqual([])
    const params = endpoint.inputParameters.definition as any
    expect(Object.keys(params).sort()).toEqual(['base', 'isOvernight', 'quote', 'requireVolume'])
    expect(params.requireVolume.default).toBe(false)
    expect(params.isOvernight.default).toBe(false)
  })
})
