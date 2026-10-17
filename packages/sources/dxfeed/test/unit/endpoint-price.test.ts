import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { endpoint, priceInputParameters } from '../../src/endpoint/price'
import { TradeProcessor, tradeTickers } from '../../src/transport/price-ws'
import { DxLinkFeed, DxLinkFeedDeps } from '../../src/transport/ws'
import frames from './fixtures/dxlink-frames.json'

// The endpoint modules log via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

const TRADE_PARAMS = { base: 'AAPL:USLF24', quote: 'USD' }

// A fresh processor per test: TradeProcessor has no reset() (round-2 item 4
// deleted the dead member) — isolation comes from a new instance, exactly like
// production reconnect behavior (module-level latestTimeBySymbol state persists)
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
    expect(definition.base.aliases).toEqual(['from', 'symbol', 'asset', 'coin', 'ticker', 'market'])
    expect(definition.quote.required).toBe(true)
    expect(definition.quote.aliases).toEqual(['to'])
    expect(definition.transport).toEqual({
      description: '"ws" (dxLink) or "rest". Overnight streams pin "ws".',
      required: false,
      type: 'string',
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
