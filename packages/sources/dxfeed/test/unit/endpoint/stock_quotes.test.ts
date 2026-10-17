import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import overrides from '../../../src/config/overrides.json'
import { endpoint } from '../../../src/endpoint/stock-quotes'
import { quoteRecordToResult } from '../../../src/transport/stock-quotes'
import { DxLinkFeed, DxLinkFeedDeps } from '../../../src/transport/ws'

LoggerFactoryProvider.set()

// Spec stock_quotes sample Quote record (first record of the sample frame)
const SPEC_RECORD = ['Quote', 'AAPL:USLF24', 1760000000000, 189.95, 190.05, 100, 200, 'V', 'V']
const PARAMS = { base: 'AAPL:USLF24', quote: 'USD', requireVolume: false, isOvernight: false }

describe('stock_quotes endpoint (spec response_mapping)', () => {
  it('maps the spec Quote record to the spec example response (mid 190.0, bid 189.95/100, ask 190.05/200)', () => {
    const response = quoteRecordToResult(SPEC_RECORD, PARAMS) as any

    expect(response).toEqual({
      result: 190,
      data: {
        mid_price: 190,
        bid_price: 189.95,
        bid_volume: 100,
        ask_price: 190.05,
        ask_volume: 200,
      },
      timestamps: { providerIndicatedTimeUnixMs: 1760000000000 },
    })
  })

  it('errors (not zeroes) on invalid bid/ask volume only when requireVolume is set', () => {
    const nanVolumeRecord = [...SPEC_RECORD]
    nanVolumeRecord[5] = 'NaN'

    const error = quoteRecordToResult(nanVolumeRecord, { ...PARAMS, requireVolume: true }) as any
    expect(error.statusCode).toBe(502)
    expect(error.errorMessage).toContain('volume')

    const ok = quoteRecordToResult(nanVolumeRecord, PARAMS) as any
    expect(ok.statusCode).toBeUndefined()
    expect(ok.result).toBe(190)
  })

  it('with isOvernight, keeps only records quoting on the O venue on both sides', () => {
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
    const oneSidedVenue = [...SPEC_RECORD]
    oneSidedVenue[8] = 'V'

    expect(quoteRecordToResult(overnightRecord, { ...PARAMS, isOvernight: true })).toBeDefined()
    expect(quoteRecordToResult(SPEC_RECORD, { ...PARAMS, isOvernight: true })).toBeUndefined()
    expect(quoteRecordToResult(oneSidedVenue, { ...PARAMS, isOvernight: true })).toBeUndefined()

    // Without isOvernight, records from any venue are kept
    expect(quoteRecordToResult(overnightRecord, PARAMS)).toBeDefined()
  })

  it('mids a one-sided book against the live side', () => {
    const bidOnly = [...SPEC_RECORD]
    bidOnly[4] = 0
    const bidSide = quoteRecordToResult(bidOnly, PARAMS) as any
    expect(bidSide.data.mid_price).toBe(189.95)
    expect(bidSide.data.ask_price).toBe(0)

    const askOnly = [...SPEC_RECORD]
    askOnly[3] = 0
    const askSide = quoteRecordToResult(askOnly, PARAMS) as any
    expect(askSide.data.mid_price).toBe(190.05)
    expect(askSide.data.bid_price).toBe(0)
  })

  it('errors (502) on an invalid bid or ask price for every params combo', () => {
    const badBid = [...SPEC_RECORD]
    badBid[3] = 'NaN'
    const error = quoteRecordToResult(badBid, PARAMS) as any
    expect(error.statusCode).toBe(502)
    expect(error.errorMessage).toContain('Bid price')

    const errorWithRequireVolume = quoteRecordToResult(badBid, {
      ...PARAMS,
      requireVolume: true,
    }) as any
    expect(errorWithRequireVolume.statusCode).toBe(502)
  })

  it('resolves the AAPL override onto the DP ticker the transport subscribes', () => {
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

    expect(messages).toEqual([
      { type: 'FEED_SUBSCRIPTION', channel: 1, add: [{ symbol: 'AAPL:USLF24', type: 'Quote' }] },
    ])
  })

  it('exposes the stock_quotes endpoint with the spec input parameters', () => {
    expect(endpoint.name).toBe('stock_quotes')
    expect(endpoint.aliases).toEqual([])
    const params = endpoint.inputParameters.definition as any
    expect(Object.keys(params).sort()).toEqual(['base', 'isOvernight', 'quote', 'requireVolume'])
    // Spec stock_quotes input_parameters: base with the shared alias set, required
    expect(params.base.required).toBe(true)
    expect(params.base.aliases).toEqual(['from', 'symbol', 'asset', 'coin', 'ticker', 'market'])
    expect(params.quote.required).toBe(true)
    expect(params.quote.aliases).toEqual(['to'])
    expect(params.requireVolume.default).toBe(false)
    expect(params.isOvernight.default).toBe(false)
  })

  it('validates the spec example request, resolving the from/to aliases', () => {
    expect(endpoint.inputParameters.validateInput({ from: 'AAPL', to: 'USD' })).toEqual({
      base: 'AAPL',
      quote: 'USD',
      requireVolume: false,
      isOvernight: false,
    })
  })
})
