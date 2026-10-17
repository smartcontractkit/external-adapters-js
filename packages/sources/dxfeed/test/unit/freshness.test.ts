import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { TradeProcessor } from '../../src/transport/price-ws'
import { quoteRecordToResult } from '../../src/transport/stock-quotes'

LoggerFactoryProvider.set()

// Plan round1-freshness-cache-metrics proving test — owner decision
// stale_quote_serving=serve_last_value_with_timestamp: staleness is tracked and
// reported through the carried provider timestamp, NEVER rejected. There is no
// max-age threshold anywhere in the adapter, so a quote of ANY age must still
// serve as a cacheable success carrying its original providerIndicatedTimeUnixMs.

const QUOTE_PARAMS = { base: 'AAPL:USLF24', quote: 'USD', requireVolume: false, isOvernight: false }

// Spec stock_quotes sample record, first record of the sample frame:
// bid 189.95 / ask 190.05 -> mid 190.0, provider time 1760000000000
const SPEC_QUOTE_RECORD = [
  'Quote',
  'AAPL:USLF24',
  1760000000000,
  189.95,
  190.05,
  100,
  200,
  'V',
  'V',
]

// Spec price sample record: price 189.98, provider time 1760000000000
const SPEC_TRADE_RECORD = [
  'Trade',
  'AAPL:USLF24',
  1760000000000,
  189.98,
  10,
  12345,
  'V',
  0.12,
  5000000,
  999000000,
  'UP',
  false,
]

describe('stale-quote serving (owner decision stale_quote_serving=serve_last_value_with_timestamp)', () => {
  it('a quote older than any threshold still serves with its original provider timestamp', () => {
    // A fixed "now" (the round date) so every age in the table is deterministic.
    // The adapter has no max-age check, so every age — including one far older
    // than any conceivable staleness threshold — must serve.
    const now = 1760000000000 + 7 * 24 * 60 * 60 * 1000 // one week after the sample
    for (const ageMs of [
      30_000, // 30 seconds
      60 * 60 * 1000, // 1 hour
      24 * 60 * 60 * 1000, // 1 day (overnight / weekend quiet)
      7 * 24 * 60 * 60 * 1000, // 1 week (market closed)
      365 * 24 * 60 * 60 * 1000, // 1 year
    ]) {
      const staleTime = now - ageMs
      const record = [...SPEC_QUOTE_RECORD]
      record[2] = staleTime

      const response = quoteRecordToResult(record, QUOTE_PARAMS) as any

      // Served — no 502, no error message, the spec mid value
      expect(response.statusCode).toBeUndefined()
      expect(response.errorMessage).toBeUndefined()
      expect(response.result).toBe(190.0)
      // The ORIGINAL provider timestamp rides the result (freshness reporting),
      // it is never clamped, dropped or rejected
      expect(response.timestamps).toEqual({ providerIndicatedTimeUnixMs: staleTime })
    }
  })

  it('a stale trade serves the same way on the price path (result=price, timestamp=time)', () => {
    const staleTime = 1760000000000 - 365 * 24 * 60 * 60 * 1000 // one year old
    const record = [...SPEC_TRADE_RECORD]
    record[2] = staleTime

    const response = new TradeProcessor().processRecord('Trade', record, {
      base: 'AAPL:USLF24',
      quote: 'USD',
    } as any) as any

    expect(response.statusCode).toBeUndefined()
    expect(response.errorMessage).toBeUndefined()
    // Spec price response_mapping: result = price
    expect(response.result).toBe(189.98)
    expect(response.timestamps).toEqual({ providerIndicatedTimeUnixMs: staleTime })
  })

  it('a quote with no finite provider time still serves, carrying no timestamp rather than a NaN one', () => {
    // The staleness guard reports through the provider timestamp; a record with
    // a nonnumeric time has nothing to report and must not fabricate one
    const record = [...SPEC_QUOTE_RECORD]
    record[2] = 'NaN'

    const response = quoteRecordToResult(record, QUOTE_PARAMS) as any

    expect(response.statusCode).toBeUndefined()
    expect(response.errorMessage).toBeUndefined()
    expect(response.result).toBe(190.0)
    expect(response.timestamps).toBeUndefined()
  })
})
