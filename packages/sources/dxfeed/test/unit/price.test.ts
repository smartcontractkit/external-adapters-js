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

  it('declares the transport input param with the ws|rest values (closes CONF-PARAM-MISMATCH)', () => {
    const definition = priceInputParameters.definition as any
    expect(Object.keys(definition).sort()).toEqual(['base', 'quote', 'transport'])
    // Spec price input_parameters: base with the shared alias set, required
    expect(definition.base.required).toBe(true)
    expect(definition.base.aliases).toEqual(['from', 'symbol', 'asset', 'coin', 'ticker', 'market'])
    expect(definition.quote.required).toBe(true)
    expect(definition.quote.aliases).toEqual(['to'])
    // Spec: transport optional, "ws" (dxLink) or "rest"
    expect(definition.transport.required).toBe(false)
    expect(definition.transport.options).toEqual(['ws', 'rest'])
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
