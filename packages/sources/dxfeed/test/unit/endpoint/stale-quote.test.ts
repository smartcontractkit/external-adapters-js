import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { TradeProcessor } from '../../../src/transport/price-ws'
import { quoteRecordToResult } from '../../../src/transport/stock-quotes'
import frames from '../fixtures/dxlink-frames.json'

LoggerFactoryProvider.set()

const QUOTE_PARAMS = { base: 'AAPL:USLF24', quote: 'USD', requireVolume: false, isOvernight: false }
const TRADE_PARAMS = { base: 'AAPL:USLF24', quote: 'USD' }

// Spec stock_quotes sample_response, first record. The timestamp (2025-10-09) is
// in the past relative to any test clock: staleness must never turn it into an
// error (owner decision stale_quote_serving=serve_last_value_with_timestamp).
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

describe('stale-quote serving (owner decision stale_quote_serving=serve_last_value_with_timestamp)', () => {
  it('after quotes stop arriving, the last value is served with its original providerIndicatedTimeUnixMs and no error', () => {
    const response = quoteRecordToResult(SPEC_QUOTE_RECORD, QUOTE_PARAMS) as any

    expect(response.errorMessage).toBeUndefined()
    expect(response.statusCode).toBeUndefined()
    expect(response.result).toBe(190)
    expect(response.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
  })

  it('a stale trade is served the same way — no max-age rejection exists on the price path', () => {
    const response = new TradeProcessor().processRecord(
      'Trade',
      frames.priceTradeFrame.data[1] as any,
      TRADE_PARAMS as any,
    ) as any

    expect(response.errorMessage).toBeUndefined()
    expect(response.statusCode).toBeUndefined()
    expect(response.result).toBe(189.98)
    expect(response.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
  })
})
