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
    // Spec: transport is optional, "ws" (dxLink) or "rest"; a value outside the
    // registered transportRoutes is rejected by the router
    const badRequest = {
      body: { data: { base: 'AAPL', quote: 'USD', transport: 'graphql' } },
    } as any
    expect(() => endpoint.getTransportNameForRequest(badRequest, {} as any)).toThrow(
      /No transport found for key "graphql"/,
    )
  })

  it('declares exactly the spec input parameters: base (aliased), quote and the optional transport param (plan CONF-PARAM-MISMATCH)', () => {
    const definition = priceInputParameters.definition as any
    expect(Object.keys(definition).sort()).toEqual(['base', 'quote', 'transport'])
    // Spec price input_parameters: base with the shared alias set, required
    expect(definition.base.required).toBe(true)
    expect(definition.base.aliases).toEqual(['from', 'symbol', 'asset', 'coin', 'ticker', 'market'])
    expect(definition.quote.required).toBe(true)
    expect(definition.quote.aliases).toEqual(['to'])
    // Spec price input_parameters: transport optional, type string
    expect(definition.transport.required).toBe(false)
    expect(definition.transport.type).toBe('string')
    // transport=ws still routes to the WS transport through the framework router
    const wsRequest = { body: { data: { base: 'AAPL', quote: 'USD', transport: 'ws' } } } as any
    expect(endpoint.getTransportNameForRequest(wsRequest, {} as any)).toBe('ws')
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

describe('merged: input-parameters.test', () => {
  LoggerFactoryProvider.set()

  /**
   * Spec price input_parameters: base and quote, plus the optional `transport`
   * param ("ws" (dxLink stream) or "rest"; overnight streams pin "ws") declared
   * on the definition (plan CONF-PARAM-MISMATCH) — the router also owns ws|rest
   * routing off the same raw request field.
   */
  describe('price endpoint input parameters (spec external_adapter_specifications.price input_parameters)', () => {
    it('declares the optional transport param (type string, required false, spec description)', () => {
      const definition = priceInputParameters.definition as any

      expect(Object.keys(definition).sort()).toEqual(['base', 'quote', 'transport'])
      expect(definition.transport).toEqual({
        description: '"ws" (dxLink) or "rest". Overnight streams pin "ws".',
        required: false,
        type: 'string',
        options: ['rest', 'ws'],
      })
    })

    it('declares base (required, spec alias set) and quote (required, "to" alias)', () => {
      const definition = priceInputParameters.definition as any

      expect(definition.base.required).toBe(true)
      expect(definition.base.aliases).toEqual([
        'from',
        'symbol',
        'asset',
        'coin',
        'ticker',
        'market',
      ])
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
})
