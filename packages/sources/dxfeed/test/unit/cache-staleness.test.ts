import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { tradeProcessor } from '../../src/transport/price-ws'
import { quoteRecordToResult } from '../../src/transport/stock-quotes'

LoggerFactoryProvider.set()

describe('stale value serving (owner decisions stale_quote_serving + reconnect_cache_behavior)', () => {
  it('serves stale quotes as success with the original provider timestamp, without any max-age error', () => {
    // The spec sample timestamp (2025-10-09) is in the past relative to the test
    // clock; the record must still map to a cacheable success carrying that time
    const staleRecord = ['Quote', 'AAPL:USLF24', 1760000000000, 189.95, 190.05, 100, 200, 'V', 'V']
    const response = quoteRecordToResult(staleRecord, {
      base: 'AAPL:USLF24',
      quote: 'USD',
      requireVolume: false,
      isOvernight: false,
    }) as any

    expect(response.errorMessage).toBeUndefined()
    expect(response.statusCode).toBeUndefined()
    expect(response.timestamps.providerIndicatedTimeUnixMs).toBe(1760000000000)
  })

  it('serves stale trades as success with the original provider timestamp, without any max-age error', () => {
    const staleRecord = [
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
    const response = tradeProcessor.processRecord('Trade', staleRecord, {
      base: 'AAPL:USLF24',
      quote: 'USD',
    } as any) as any

    expect(response.errorMessage).toBeUndefined()
    expect(response.statusCode).toBeUndefined()
    expect(response.timestamps.providerIndicatedTimeUnixMs).toBe(1760000000000)
  })
})
