import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { endpoint, priceInputParameters } from '../../src/endpoint/price'

LoggerFactoryProvider.set()

/**
 * Plan round-2 item 3 proving test: `transport` is a framework-RESERVED routing
 * param — the router reads data.transport for routing WITHOUT a declaration in
 * the InputParameters. The former type-cast smuggling of the key into the
 * runtime definition is gone.
 */
describe('price endpoint input parameters (spec external_adapter_specifications.price input_parameters)', () => {
  it('does NOT declare the framework-reserved transport routing param (round-2 item 3 fix)', () => {
    const definition = priceInputParameters.definition as any

    expect(definition.transport).toBeUndefined()
    expect(Object.keys(definition).sort()).toEqual(['base', 'quote'])
  })

  it('declares base (required, spec alias set) and quote (required, "to" alias) alongside transport', () => {
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
