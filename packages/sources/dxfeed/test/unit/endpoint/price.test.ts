import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { endpoint, priceInputParameters } from '../../../src/endpoint/price'
import { TradeProcessor, tradeTickers } from '../../../src/transport/price-ws'
import frames from '../fixtures/dxlink-frames.json'

LoggerFactoryProvider.set()

// A fresh processor per test: TradeProcessor has no reset() (round-2 item 4
// deleted the dead member) — isolation comes from a new instance, exactly like
// production behavior (latestTimeBySymbol is a per-transport-instance field,
// never a module-level singleton)
let processor: TradeProcessor
beforeEach(() => {
  processor = new TradeProcessor()
})

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

    // The same request without transport falls back to the defaultTransport,
    // so the untouched REST path (owner decision rest_transport_scope) keeps serving
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

  it('declares exactly the spec input parameters: base (aliased), quote, and the optional transport param (plan CONF-PARAM-MISMATCH: spec param transport present in InputParameters)', () => {
    const definition = priceInputParameters.definition as any
    expect(Object.keys(definition).sort()).toEqual(['base', 'quote', 'transport'])
    // Spec price input_parameters: base with the shared alias set, required
    expect(definition.base.required).toBe(true)
    expect(definition.base.aliases).toEqual(['from', 'symbol', 'asset', 'coin', 'ticker', 'market'])
    expect(definition.quote.required).toBe(true)
    expect(definition.quote.aliases).toEqual(['to'])
    // Spec price input_parameters: transport optional, type string, spec description
    expect(definition.transport.required).toBe(false)
    expect(definition.transport.type).toBe('string')
    expect(definition.transport.description).toBe(
      '"ws" (dxLink) or "rest". Overnight streams pin "ws".',
    )
  })

  it('a request with transport=ws validates and routes to the WS transport (plan CONF-PARAM-MISMATCH proving test)', () => {
    // The declared optional param validates through InputParameters...
    expect(
      priceInputParameters.validateInput({ base: 'AAPL', quote: 'USD', transport: 'ws' }),
    ).toEqual({
      base: 'AAPL',
      quote: 'USD',
      transport: 'ws',
    })
    // ...and the same value routes to the dxLink WS transport through the
    // framework router, which reads the raw request data.transport
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

describe('Trade / TradeETH newest-time selection (spec price endpoint description)', () => {
  it('serves the spec Trade record with result=price and providerIndicatedTimeUnixMs=time', () => {
    const response = processor.processRecord(
      'Trade',
      frames.priceTradeFrame.data[1] as any,
      {
        base: 'AAPL:USLF24',
        quote: 'USD',
      } as any,
    ) as any

    // Spec endpoint_request_response_examples[1]: {"data": {"result": 189.98},
    // "result": 189.98, providerIndicatedTimeUnixMs 1760000000000}
    expect(response.result).toBe(189.98)
    expect(response.data).toEqual({ result: 189.98 })
    expect(response.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
  })

  it('serves the newer TradeETH record when both Trade and TradeETH arrive for the symbol', () => {
    // Regular-hours Trade at t=1760000000000 (the spec sample)
    processor.processRecord(
      'Trade',
      frames.priceTradeFrame.data[1] as any,
      {
        base: 'AAPL:USLF24',
        quote: 'USD',
      } as any,
    )

    // Newer extended-hours TradeETH at t=1760000000500 wins
    const newer = processor.processRecord(
      'TradeETH',
      [
        'TradeETH',
        'AAPL:USLF24',
        1760000000500,
        190.02,
        5,
        12346,
        'V',
        0.13,
        5000001,
        999000001,
        'DOWN',
        true,
      ],
      { base: 'AAPL:USLF24', quote: 'USD' } as any,
    ) as any
    expect(newer.result).toBe(190.02)
    expect(newer.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000500 })

    // A late-arriving older record is dropped, not served
    const late = processor.processRecord(
      'Trade',
      [
        'Trade',
        'AAPL:USLF24',
        1760000000200,
        188.0,
        1,
        12344,
        'V',
        0.11,
        5000000,
        999000000,
        'UP',
        false,
      ],
      { base: 'AAPL:USLF24', quote: 'USD' } as any,
    ) as any
    expect(late).toBeUndefined()
  })

  it('serves a newer regular-hours Trade when TradeETH arrived first (newest time wins in either direction)', () => {
    // Extended-hours TradeETH at t=1760000000000 (the spec sample time)
    processor.processRecord(
      'TradeETH',
      [
        'TradeETH',
        'AAPL:USLF24',
        1760000000000,
        190.02,
        5,
        12346,
        'V',
        0.13,
        5000001,
        999000001,
        'DOWN',
        true,
      ],
      { base: 'AAPL:USLF24', quote: 'USD' } as any,
    )

    // A newer regular-hours Trade record wins the newest-time selection
    const newer = processor.processRecord(
      'Trade',
      [
        'Trade',
        'AAPL:USLF24',
        1760000000500,
        189.98,
        10,
        12348,
        'V',
        0.12,
        5000000,
        999000000,
        'UP',
        false,
      ],
      { base: 'AAPL:USLF24', quote: 'USD' } as any,
    ) as any
    expect(newer.result).toBe(189.98)
    expect(newer.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000500 })

    // An older, late-arriving TradeETH record is dropped, not served
    const late = processor.processRecord(
      'TradeETH',
      [
        'TradeETH',
        'AAPL:USLF24',
        1760000000200,
        190.5,
        3,
        12347,
        'V',
        0.14,
        5000002,
        999000002,
        'DOWN',
        true,
      ],
      { base: 'AAPL:USLF24', quote: 'USD' } as any,
    )
    expect(late).toBeUndefined()
  })

  it('serves an equal-time record like the newest one (reference_ea: preserve endpoint semantics exactly)', () => {
    // The reference price transport ignores only strictly older records
    // (updatedTime[base] > time): a record tying the newest time is served
    processor.processRecord(
      'Trade',
      frames.priceTradeFrame.data[1] as any,
      {
        base: 'AAPL:USLF24',
        quote: 'USD',
      } as any,
    )

    const tie = processor.processRecord(
      'TradeETH',
      [
        'TradeETH',
        'AAPL:USLF24',
        1760000000000,
        189.99,
        7,
        12347,
        'V',
        0.14,
        5000002,
        999000002,
        'DOWN',
        true,
      ],
      { base: 'AAPL:USLF24', quote: 'USD' } as any,
    ) as any
    expect(tie.result).toBe(189.99)
    expect(tie.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
  })

  it('errors (502) on a trade whose price is the invalid "NaN" string', () => {
    const response = processor.processRecord(
      'Trade',
      [
        'Trade',
        'AAPL:USLF24',
        1760000000000,
        'NaN',
        10,
        12345,
        'V',
        0.12,
        5000000,
        999000000,
        'UP',
        false,
      ],
      { base: 'AAPL:USLF24', quote: 'USD' } as any,
    ) as any
    expect(response.statusCode).toBe(502)
    expect(response.errorMessage).toContain('invalid')
  })

  it('subscribes Trade only for a bare ticker and Trade+TradeETH for :USLF24 (owner decision match_reference)', () => {
    expect(tradeTickers('AAPL')).toEqual([{ symbol: 'AAPL', type: 'Trade' }])
    expect(tradeTickers('aapl:uslf24')).toEqual([
      { symbol: 'AAPL:USLF24', type: 'Trade' },
      { symbol: 'AAPL:USLF24', type: 'TradeETH' },
    ])
  })
})
