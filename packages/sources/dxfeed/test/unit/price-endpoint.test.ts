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

  it('routes the spec example request (from/to aliases, transport=ws) to the ws transport', () => {
    // Spec endpoint_request_response_examples[1]: {"endpoint": "stock", "from":
    // "AAPL", "to": "USD", "transport": "ws"} — alias-resolved params must
    // validate and still pin the dxLink ws transport
    const wsRequest = { body: { data: { from: 'AAPL', to: 'USD', transport: 'ws' } } } as any
    expect(endpoint.getTransportNameForRequest(wsRequest, {} as any)).toBe('ws')
    expect(endpoint.inputParameters.validateInput({ from: 'AAPL', to: 'USD' })).toEqual({
      base: 'AAPL',
      quote: 'USD',
    })

    // The same request without transport falls back to the defaultTransport
    const noTransportRequest = { body: { data: { from: 'AAPL', to: 'USD' } } } as any
    expect(endpoint.getTransportNameForRequest(noTransportRequest, {} as any)).toBe('rest')
  })

  it('rejects transport values outside the registered ws|rest routes with a 400', () => {
    // Spec: transport is optional, "ws" (dxLink) or "rest". It is a
    // framework-reserved routing param (not re-declarable in InputParameters
    // in 2.20.0), validated against the registered transportRoutes.
    const badRequest = {
      body: { data: { base: 'AAPL', quote: 'USD', transport: 'graphql' } },
    } as any
    expect(() => endpoint.getTransportNameForRequest(badRequest, {} as any)).toThrow(
      /No transport found for key "graphql"/,
    )
  })

  it('declares exactly the spec input parameters: base (aliased), quote, and optional transport', () => {
    const definition = priceInputParameters.definition as any
    expect(Object.keys(definition).sort()).toEqual(['base', 'quote', 'transport'])
    // Spec price input_parameters: base with the shared alias set, required
    expect(definition.base.required).toBe(true)
    expect(definition.base.aliases).toEqual(['from', 'symbol', 'asset', 'coin', 'ticker', 'market'])
    expect(definition.quote.required).toBe(true)
    expect(definition.quote.aliases).toEqual(['to'])
    // Spec price input_parameters: transport optional, "ws" (dxLink) or "rest"
    expect(definition.transport.required).toBe(false)
    expect(definition.transport.options).toEqual(['ws', 'rest'])
  })

  it('validates the spec example request, resolving the from/to aliases', () => {
    expect(priceInputParameters.validateInput({ from: 'AAPL', to: 'USD' })).toEqual({
      base: 'AAPL',
      quote: 'USD',
    })
    expect(priceInputParameters.validateInput({ base: 'AAPL:USLF24', quote: 'USD' })).toEqual({
      base: 'AAPL:USLF24',
      quote: 'USD',
    })
  })
})
