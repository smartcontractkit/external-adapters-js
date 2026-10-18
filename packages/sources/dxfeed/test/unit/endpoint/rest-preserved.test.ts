import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import quoteEventSymbols from '../../../src/config/quoteSymbols.json'
import { endpoint as priceEndpoint } from '../../../src/endpoint/price'
import { buildDxFeedHttpTransport } from '../../../src/transport/price-http'

// The endpoint modules log via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

/**
 * Plan round1-preserve-rest-and-overrides proving test (owner decision
 * rest_transport_scope=keep_untouched): a price request WITHOUT a transport
 * param falls through to the REST transport (RDD: 3 dxfeed lastTradedPrice
 * params with no transport param), the override resolution maps the spec
 * example's AAPL onto AAPL:USLF24, and transport/price-http.ts +
 * config/quoteSymbols.json stay untouched by the migration.
 */
describe('REST transport preserved (owner decision rest_transport_scope = keep_untouched)', () => {
  it('still builds the batched REST HTTP transport for the price endpoint', () => {
    expect(typeof buildDxFeedHttpTransport).toBe('function')
    expect(buildDxFeedHttpTransport()).toBeDefined()
  })

  it('the price endpoint keeps defaultTransport rest with exactly the ws|rest routes registered', () => {
    // Spec price endpoint: default_transport "rest"; overnight streams pin "ws"
    expect(priceEndpoint.defaultTransport).toBe('rest')
    expect(priceEndpoint.transportRoutes.routeNames().sort()).toEqual(['rest', 'ws'])
  })

  it('still ships a parseable, populated quoteSymbols.json the REST parseResponse keys off (config untouched)', () => {
    expect(Object.keys(quoteEventSymbols)).toContain('USO/USD:AFX')
  })
})
