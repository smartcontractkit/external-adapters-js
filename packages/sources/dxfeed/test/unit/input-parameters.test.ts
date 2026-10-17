import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { endpoint, priceInputParameters } from '../../src/endpoint/price'

LoggerFactoryProvider.set()

/**
 * Spec price input_parameters: base and quote. The optional `transport` param
 * ("ws" (dxLink stream) or "rest"; overnight streams pin "ws") is a framework
 * reserved param handled by the router, not a declared one (round-2).
 */
describe('price endpoint input parameters (spec external_adapter_specifications.price input_parameters)', () => {
  it('keeps the reserved transport param out of the definition (the router owns ws|rest routing)', () => {
    const definition = priceInputParameters.definition as any

    expect(definition.transport).toBeUndefined()
    expect(Object.keys(definition).sort()).toEqual(['base', 'quote'])
  })

  it('declares base (required, spec alias set) and quote (required, "to" alias)', () => {
    const definition = priceInputParameters.definition as any

    expect(definition.base.required).toBe(true)
    expect(definition.base.aliases).toEqual(['from', 'symbol', 'asset', 'coin', 'ticker', 'market'])
    expect(definition.quote.required).toBe(true)
    expect(definition.quote.aliases).toEqual(['to'])
  })

  it('validates the spec example request body, resolving the from/to aliases', () => {
    // Spec endpoint_request_response_examples[1] request: {"from": "AAPL", "to": "USD", "transport": "ws"}
    expect(priceInputParameters.validateInput({ from: 'AAPL', to: 'USD' })).toEqual({
      base: 'AAPL',
      quote: 'USD',
    })
  })

  it('keeps defaultTransport "rest" with the dxLink ws route registered (spec default_transport + overnight pinning)', () => {
    expect(endpoint.defaultTransport).toBe('rest')
    expect(endpoint.transportRoutes.routeNames().sort()).toEqual(['rest', 'ws'])

    // A request without transport falls through to the REST transport
    const noTransportRequest = { body: { data: { from: 'AAPL', to: 'USD' } } } as any
    expect(endpoint.getTransportNameForRequest(noTransportRequest, {} as any)).toBe('rest')

    // Overnight streams pin "ws" — the spec example request with transport "ws"
    const wsRequest = { body: { data: { from: 'AAPL', to: 'USD', transport: 'ws' } } } as any
    expect(endpoint.getTransportNameForRequest(wsRequest, {} as any)).toBe('ws')
  })
})
