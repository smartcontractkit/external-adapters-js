import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { endpoint, priceInputParameters } from '../../src/endpoint/price'

LoggerFactoryProvider.set()

describe('price endpoint (spec data_source_endpoints price / ws transport)', () => {
  it('exposes the price endpoint under all its spec aliases', () => {
    expect(endpoint.name).toBe('price')
    expect(endpoint.aliases).toEqual(['crypto', 'stock', 'forex', 'commodities'])
  })

  it('registers the dxLink ws transport and keeps rest as the default', () => {
    expect(endpoint.defaultTransport).toBe('rest')
    expect(endpoint.transportRoutes.routeNames().sort()).toEqual(['rest', 'ws'])
  })

  it('routes transport=ws requests to the ws transport and falls back to rest', () => {
    const wsRequest = { body: { data: { base: 'AAPL', quote: 'USD', transport: 'ws' } } } as any
    expect(endpoint.getTransportNameForRequest(wsRequest, {} as any)).toBe('ws')

    const restRequest = { body: { data: { base: 'AAPL', quote: 'USD' } } } as any
    expect(endpoint.getTransportNameForRequest(restRequest, {} as any)).toBe('rest')
  })

  it('requires the quote (to) conversion param on top of the shared base params', () => {
    const definition = priceInputParameters.definition as any
    expect(definition.quote.required).toBe(true)
    expect(definition.quote.aliases).toEqual(['to'])
    expect(definition.base.aliases).toContain('from')
  })
})
