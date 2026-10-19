import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { endpoint, priceInputParameters } from '../../src/endpoint/price'
import { TradeProcessor, tradeTickers } from '../../src/transport/price-ws'
import { DxLinkFeed, DxLinkFeedDeps } from '../../src/transport/ws'
import frames from './fixtures/dxlink-frames.json'

LoggerFactoryProvider.set()

// Spec price sample Trade record:
// eventType,eventSymbol,time,price,size,sequence,exchangeCode,change,dayVolume,dayTurnover,tickDirection,extendedTradingHours
const TRADE_PARAMS = { base: 'AAPL:USLF24', quote: 'USD' }

describe('price endpoint wiring (spec external_adapter_specifications.price)', () => {
  it('exposes the price endpoint under all its spec aliases', () => {
    expect(endpoint.name).toBe('price')
    expect(endpoint.aliases).toEqual(['crypto', 'stock', 'forex', 'commodities'])
  })

  it('declares base, quote and the optional transport param (plan CONF-PARAM-MISMATCH: spec param transport declared)', () => {
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

  it('resolves defaultTransport to rest when transport is absent (owner decision rest_transport_scope)', () => {
    expect(endpoint.defaultTransport).toBe('rest')
    expect(endpoint.transportRoutes.routeNames().sort()).toEqual(['rest', 'ws'])

    const noTransportRequest = { body: { data: { from: 'AAPL', to: 'USD' } } } as any
    expect(endpoint.getTransportNameForRequest(noTransportRequest, {} as any)).toBe('rest')
  })

  it('pins the ws transport when the request asks for it (overnight streams pin "ws")', () => {
    // Spec endpoint_request_response_examples[1] request: {"endpoint": "stock",
    // "from": "AAPL", "to": "USD", "transport": "ws"}
    const wsRequest = { body: { data: { from: 'AAPL', to: 'USD', transport: 'ws' } } } as any
    expect(endpoint.getTransportNameForRequest(wsRequest, {} as any)).toBe('ws')
    expect(endpoint.inputParameters.validateInput({ from: 'AAPL', to: 'USD' })).toEqual({
      base: 'AAPL',
      quote: 'USD',
    })
  })

  it('rejects transport values outside the ws|rest routes', () => {
    const badRequest = {
      body: { data: { base: 'AAPL', quote: 'USD', transport: 'graphql' } },
    } as any
    expect(() => endpoint.getTransportNameForRequest(badRequest, {} as any)).toThrow(
      /No transport found for key "graphql"/,
    )
  })
})

describe('Trade / TradeETH subscription policy (owner decision tradeteth=match_reference)', () => {
  it('subscribes Trade AND TradeETH for an :USLF24 ticker', () => {
    expect(tradeTickers('AAPL:USLF24')).toEqual([
      { symbol: 'AAPL:USLF24', type: 'Trade' },
      { symbol: 'AAPL:USLF24', type: 'TradeETH' },
    ])
    // Case-insensitive on the suffix, upper-cased on the wire
    expect(tradeTickers('aapl:uslf24')).toEqual([
      { symbol: 'AAPL:USLF24', type: 'Trade' },
      { symbol: 'AAPL:USLF24', type: 'TradeETH' },
    ])
  })

  it('subscribes Trade only for a bare ticker', () => {
    expect(tradeTickers('SPCX')).toEqual([{ symbol: 'SPCX', type: 'Trade' }])
  })

  it('sends the full desired set as FEED_SUBSCRIPTION adds over the dxLink feed channel', () => {
    const feed = new DxLinkFeed({
      formatTickers: (params: any) => tradeTickers(params.base),
      processRecord: () => undefined,
    } as DxLinkFeedDeps<any>)

    expect(
      feed.subscriptionMessages({ desired: [TRADE_PARAMS], new: [TRADE_PARAMS], stale: [] }),
    ).toEqual([
      {
        type: 'FEED_SUBSCRIPTION',
        channel: 1,
        add: [
          { symbol: 'AAPL:USLF24', type: 'Trade' },
          { symbol: 'AAPL:USLF24', type: 'TradeETH' },
        ],
      },
    ])
  })
})

describe('last trade price mapping (spec price response_mapping)', () => {
  let processor: TradeProcessor
  beforeEach(() => {
    processor = new TradeProcessor()
  })

  it('maps the spec Trade record to result 189.98 with providerIndicatedTimeUnixMs 1760000000000', () => {
    // Spec endpoint_request_response_examples[1] response: data.result 189.98,
    // result 189.98, timestamps.providerIndicatedTimeUnixMs 1760000000000
    const response = processor.processRecord(
      'Trade',
      frames.priceTradeFrame.data[1] as any,
      TRADE_PARAMS as any,
    ) as any

    expect(response.result).toBe(189.98)
    expect(response.data).toEqual({ result: 189.98 })
    expect(response.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
    expect(response.statusCode).toBeUndefined()
  })

  it('serves the newer-time record when both Trade and TradeETH arrive for the symbol', () => {
    // Regular-hours Trade at t=1760000000000 (the spec sample)
    processor.processRecord('Trade', frames.priceTradeFrame.data[1] as any, TRADE_PARAMS as any)

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
      TRADE_PARAMS as any,
    ) as any
    expect(newer.result).toBe(190.02)
    expect(newer.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000500 })

    // An older, late-arriving record is dropped, not served
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
      TRADE_PARAMS as any,
    ) as any
    expect(late).toBeUndefined()
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
      TRADE_PARAMS as any,
    ) as any
    expect(response.statusCode).toBe(502)
    expect(response.errorMessage).toContain('invalid')
  })
})

describe('reconnect window (owner decision reconnect_cache_behavior=serve_cached_last_value)', () => {
  it('keeps mapping state across CHANNEL_CLOSED so the cached last value stays servable and the resubscribe re-adds the desired set', () => {
    const feed = new DxLinkFeed({
      formatTickers: (params: any) => tradeTickers(params.base),
      processRecord: () => ({ result: 189.98, data: { result: 189.98 } } as any),
    } as DxLinkFeedDeps<any>)
    feed.onFeedConfig(frames.priceFeedConfig.eventFields)
    feed.subscriptionMessages({ desired: [TRADE_PARAMS], new: [TRADE_PARAMS], stale: [] })

    // CHANNEL_CLOSED: no error surfaced (metrics_counters_only), no state dropped —
    // the framework ResponseCache keeps serving the last value during the
    // reconnect + re-handshake window
    expect(feed.message(frames.channelClosedFrame as any)).toEqual([])

    // The framework reconnects and re-delivers the full desired set as `new`
    expect(
      feed.subscriptionMessages({ desired: [TRADE_PARAMS], new: [TRADE_PARAMS], stale: [] }),
    ).toEqual([
      {
        type: 'FEED_SUBSCRIPTION',
        channel: 1,
        add: [
          { symbol: 'AAPL:USLF24', type: 'Trade' },
          { symbol: 'AAPL:USLF24', type: 'TradeETH' },
        ],
      },
    ])

    // Mapping still works over the re-established connection
    const out = feed.message(frames.priceTradeFrame as any)
    expect(out).toHaveLength(1)
    expect((out[0] as any).result).toBe(189.98)
  })
})

describe('merged: endpoint-price.test', () => {
  // The endpoint modules log via the framework logger, which needs a factory set
  LoggerFactoryProvider.set()

  const TRADE_PARAMS = { base: 'AAPL:USLF24', quote: 'USD' }

  // A fresh processor per test: TradeProcessor has no reset() (round-2 item 4
  // deleted the dead member) — isolation comes from a new instance, exactly like
  // production behavior (latestTimeBySymbol is a per-transport-instance field,
  // never a module-level singleton)
  let processor: TradeProcessor
  beforeEach(() => {
    processor = new TradeProcessor()
  })

  describe('input validation (spec external_adapter_specifications.price input_parameters)', () => {
    it('accepts transport "ws" and "rest" and rejects other values', () => {
      // Spec: transport optional, "ws" (dxLink stream) or "rest" (HTTP API)
      expect(
        endpoint.getTransportNameForRequest(
          { body: { data: { base: 'AAPL', quote: 'USD', transport: 'ws' } } } as any,
          {} as any,
        ),
      ).toBe('ws')
      expect(
        endpoint.getTransportNameForRequest(
          { body: { data: { base: 'AAPL', quote: 'USD', transport: 'rest' } } } as any,
          {} as any,
        ),
      ).toBe('rest')

      // Any other value resolves to no registered route and must be rejected —
      // the router owns the ws|rest check against the registered transportRoutes
      expect(() =>
        endpoint.getTransportNameForRequest(
          { body: { data: { base: 'AAPL', quote: 'USD', transport: 'graphql' } } } as any,
          {} as any,
        ),
      ).toThrow(/No transport found for key "graphql"/)
    })

    it('declares base (spec alias set), quote ("to") and the optional transport param, with defaultTransport "rest" (plan CONF-PARAM-MISMATCH: spec param transport declared)', () => {
      const definition = priceInputParameters.definition as any
      // The optional `transport` param is declared on the definition (type
      // string, required false); the router still reads the raw request
      // data.transport and validates it against the registered ws|rest routes
      expect(Object.keys(definition).sort()).toEqual(['base', 'quote', 'transport'])
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
      expect(definition.transport).toEqual({
        description: '"ws" (dxLink) or "rest". Overnight streams pin "ws".',
        required: false,
        type: 'string',
        options: ['rest', 'ws'],
      })
      expect(endpoint.defaultTransport).toBe('rest')
    })
  })

  describe('newest-time selection (spec price: "when both arrive serve the record with the newest time")', () => {
    const feedWithBothEventTypes = () => {
      const feed = new DxLinkFeed({
        formatTickers: (params: any) => tradeTickers(params.base),
        processRecord: (eventType, record, params: any) =>
          processor.processRecord(eventType, record, params),
      } as DxLinkFeedDeps<any>)
      feed.onFeedConfig(frames.priceFeedConfig.eventFields)
      feed.subscriptionMessages({ desired: [TRADE_PARAMS], new: [TRADE_PARAMS], stale: [] })
      return feed
    }

    it('serves the newest-time record when ONE COMPACT frame concatenates two Trade records with ascending times', () => {
      // Spec price: "when both arrive serve the record with the newest time".
      // acceptAggregationPeriod=1 makes the provider batch several Trade records
      // into one FEED_DATA frame, so every record per wire key must be processed
      // — last write wins — and the oldest trade must not be the one served
      const feed = feedWithBothEventTypes()

      const out = feed.message({
        type: 'FEED_DATA',
        channel: 1,
        data: [
          'Trade',
          [
            // Spec sample Trade record (t=1760000000000, price 189.98) followed by
            // a newer trade in the same frame (t=1760000000300, price 190.10)
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
            'Trade',
            'AAPL:USLF24',
            1760000000300,
            190.1,
            7,
            12347,
            'V',
            0.14,
            5000002,
            999000002,
            'UP',
            false,
          ],
        ],
      } as any)

      expect(out).toHaveLength(1)
      expect((out[0] as any).result).toBe(190.1)
      expect((out[0] as any).timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000300 })
    })

    it('serves the newest-time record across Trade and TradeETH', () => {
      const feed = feedWithBothEventTypes()

      // Regular-hours Trade at t=1760000000000 (the spec sample)
      feed.message(frames.priceTradeFrame as any)

      // A newer extended-hours TradeETH record at t=1760000000500 wins
      const newer = feed.message({
        type: 'FEED_DATA',
        channel: 1,
        data: [
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
        ],
      } as any)
      expect((newer[0] as any).result).toBe(190.02)

      // A late-arriving older record is dropped, not served
      const late = feed.message({
        type: 'FEED_DATA',
        channel: 1,
        data: [
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
        ],
      } as any)
      expect(late).toEqual([])
    })
  })

  describe('response shape (spec endpoint_request_response_examples[1])', () => {
    it('is { data: { result }, result, timestamps.providerIndicatedTimeUnixMs }', () => {
      const feed = new DxLinkFeed({
        formatTickers: (params: any) => tradeTickers(params.base),
        processRecord: (eventType, record, params: any) =>
          processor.processRecord(eventType, record, params),
      } as DxLinkFeedDeps<any>)
      feed.onFeedConfig(frames.priceFeedConfig.eventFields)
      feed.subscriptionMessages({ desired: [TRADE_PARAMS], new: [TRADE_PARAMS], stale: [] })

      const results = feed.message(frames.priceTradeFrame as any)
      expect(results).toHaveLength(1)
      // Spec example response: {"data": {"result": 189.98}, "result": 189.98,
      // "timestamps": {"providerIndicatedTimeUnixMs": 1760000000000}}
      expect((results[0] as any).data).toEqual({ result: 189.98 })
      expect((results[0] as any).result).toBe(189.98)
      expect((results[0] as any).timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
    })
  })
})
