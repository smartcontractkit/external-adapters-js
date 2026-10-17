import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import overrides from '../../src/config/overrides.json'
import { endpoint } from '../../src/endpoint/stock-quotes'
import { quoteRecordToResult } from '../../src/transport/stock-quotes'

LoggerFactoryProvider.set()

// Spec stock_quotes sample Quote record (first record of the sample frame):
// eventType,eventSymbol,time,bidPrice,askPrice,bidSize,askSize,bidExchangeCode,askExchangeCode
const SPEC_RECORD = ['Quote', 'AAPL:USLF24', 1760000000000, 189.95, 190.05, 100, 200, 'V', 'V']
const PARAMS = { base: 'AAPL:USLF24', quote: 'USD', requireVolume: false, isOvernight: false }

describe('stock_quotes Quote mapping (spec response_mapping)', () => {
  it('maps the spec Quote record to the spec example response', () => {
    // Spec endpoint_request_response_examples[0]: mid_price 190.0, bid
    // 189.95/100, ask 190.05/200, result 190.0, providerIndicatedTime 1760000000000
    const response = quoteRecordToResult(SPEC_RECORD, PARAMS) as any

    expect(response.result).toBe(190.0)
    expect(response.data).toEqual({
      mid_price: 190.0,
      bid_price: 189.95,
      bid_volume: 100,
      ask_price: 190.05,
      ask_volume: 200,
    })
    expect(response.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
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

  it('errors (502) on an invalid bid or ask price', () => {
    // Spec valueRangeScalingNotes: the JSON string "NaN" is invalid
    const badBid = [...SPEC_RECORD]
    badBid[3] = 'NaN'
    const error = quoteRecordToResult(badBid, PARAMS) as any
    expect(error.statusCode).toBe(502)
    expect(error.errorMessage).toContain('Bid price')
  })
})

describe('requireVolume (spec stock_quotes input_parameters: error, not zero, on invalid volume)', () => {
  const nanVolumeRecord = [...SPEC_RECORD]
  nanVolumeRecord[5] = 'NaN'

  it('returns an error when requireVolume=true', () => {
    const error = quoteRecordToResult(nanVolumeRecord, { ...PARAMS, requireVolume: true }) as any
    expect(error.statusCode).toBe(502)
    expect(error.errorMessage).toContain('volume')
    expect(error.data).toBeUndefined()
  })

  it('passes invalid volumes through unchanged (NaN — null on the wire), not an error, when requireVolume=false', () => {
    const ok = quoteRecordToResult(nanVolumeRecord, { ...PARAMS, requireVolume: false }) as any
    expect(ok.statusCode).toBeUndefined()
    expect(ok.result).toBe(190.0)
    // Reference semantics (plan round-2 item 1): the parsed size passes through
    // unchanged, NaN included — JSON serializes NaN to null on the wire
    expect(ok.data.bid_volume).toBeNaN()
    expect(ok.data.ask_volume).toBe(200)
  })
})

describe('isOvernight (spec: only exchange code O on both sides, Blue Ocean)', () => {
  const overnightRecord = [...SPEC_RECORD]
  overnightRecord[7] = 'O'
  overnightRecord[8] = 'O'

  it('accepts O/O records and rejects V/V (and mixed-venue) records when isOvernight=true', () => {
    expect(quoteRecordToResult(overnightRecord, { ...PARAMS, isOvernight: true })).toBeDefined()
    expect(quoteRecordToResult(SPEC_RECORD, { ...PARAMS, isOvernight: true })).toBeUndefined()

    const mixedVenue = [...SPEC_RECORD]
    mixedVenue[8] = 'O'
    expect(quoteRecordToResult(mixedVenue, { ...PARAMS, isOvernight: true })).toBeUndefined()
  })

  it('tolerates a missing isOvernight param and keeps records from any venue', () => {
    const { isOvernight, ...paramsWithoutIsOvernight } = PARAMS
    expect(quoteRecordToResult(overnightRecord, paramsWithoutIsOvernight as any)).toBeDefined()
    expect(quoteRecordToResult(SPEC_RECORD, paramsWithoutIsOvernight as any)).toBeDefined()
  })
})

describe('stale quote serving (owner decision stale_quote_serving=serve_last_value_with_timestamp)', () => {
  it('serves a stale quote as success with its original provider timestamp, with no max-age rejection', () => {
    // The spec sample timestamp is long in the past relative to the test clock;
    // the record must still map to a success carrying that original time
    const response = quoteRecordToResult(SPEC_RECORD, PARAMS) as any

    expect(response.errorMessage).toBeUndefined()
    expect(response.statusCode).toBeUndefined()
    expect(response.timestamps.providerIndicatedTimeUnixMs).toBe(1760000000000)
  })
})

describe('stock_quotes endpoint wiring (spec external_adapter_specifications.stock_quotes)', () => {
  it('declares the spec input parameters: base (aliased), quote (aliased), requireVolume, isOvernight', () => {
    expect(endpoint.name).toBe('stock_quotes')
    expect(endpoint.aliases).toEqual([])
    const params = endpoint.inputParameters.definition as any
    expect(Object.keys(params).sort()).toEqual(['base', 'isOvernight', 'quote', 'requireVolume'])
    expect(params.base.required).toBe(true)
    expect(params.base.aliases).toEqual(['from', 'symbol', 'asset', 'coin', 'ticker', 'market'])
    expect(params.quote.required).toBe(true)
    expect(params.quote.aliases).toEqual(['to'])
    expect(params.requireVolume.default).toBe(false)
    expect(params.isOvernight.default).toBe(false)
  })

  it('validates the spec example request, resolving the from/to aliases', () => {
    // Spec endpoint_request_response_examples[0] request: {"from": "AAPL", "to": "USD"}
    expect(endpoint.inputParameters.validateInput({ from: 'AAPL', to: 'USD' })).toEqual({
      base: 'AAPL',
      quote: 'USD',
      requireVolume: false,
      isOvernight: false,
    })
  })

  it('preserves the hardcoded override layer (spec overrides=preserve: pre-migration entries intact)', () => {
    // The hardcoded override layer is out of scope for the dxLink migration:
    // its pre-migration entries are preserved as-is (overrides=preserve); the
    // spec example's AAPL->AAPL:USLF24 mapping arrives per-request
    // (overrides.dxfeed in the request body), not through this file
    expect(overrides.dxfeed.WTI).toBe('USO/USD:AFX')
  })
})
