import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { TradeProcessor, tradeTickers } from '../../../src/transport/price-ws'
import { DxLinkFeed, DxLinkFeedDeps } from '../../../src/transport/ws'
import frames from '../fixtures/dxlink-frames.json'

// The transport modules log via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

/**
 * Plan item endpoint-price-ws proving test (spec price endpoint, WS path on
 * dxLink). The production wiring is (formatTickers=tradeTickers,
 * processRecord=TradeProcessor) inside a DxLinkFeed — the same wiring
 * buildPriceWsTransport installs into the framework WebSocketTransport hooks.
 * Every asserted value traces to the spec price sample_response /
 * endpoint_request_response_examples, never to the implementation's output.
 */
const priceFeed = (base: string) => {
  const processor = new TradeProcessor()
  const feed = new DxLinkFeed({
    formatTickers: (params: any) => tradeTickers(params.base),
    processRecord: (eventType, record, params: any) =>
      processor.processRecord(eventType, record, params),
  } as DxLinkFeedDeps<any>)
  // FEED_CONFIG (handed over by the open gate), then the desired-set registration
  // the framework's customSubscriptionMessages builder performs
  feed.onFeedConfig(frames.priceFeedConfig.eventFields)
  const params = { base, quote: 'USD' }
  feed.subscriptionMessages({ desired: [params], new: [params], stale: [] })
  return feed
}

const tradeFrame = (symbol: string, time: number, price: number) => ({
  type: 'FEED_DATA',
  channel: 1,
  data: [
    'Trade',
    // Spec FEED_CONFIG eventFields.Trade order
    ['Trade', symbol, time, price, 10, 12345, 'V', 0.12, 5000000, 999000000, 'UP', false],
  ],
})

const tradeEthFrame = (symbol: string, time: number, price: number) => ({
  type: 'FEED_DATA',
  channel: 1,
  data: [
    'TradeETH',
    // Same field order as Trade (spec price sample_response FEED_CONFIG)
    ['TradeETH', symbol, time, price, 5, 12346, 'V', 0.13, 5000001, 999000001, 'DOWN', true],
  ],
})

describe('price ws path: TradeETH subscription gating (owner decision tradeteth_subscription_policy=match_reference)', () => {
  it('a :USLF24 symbol subscribes Trade AND TradeETH', () => {
    // Spec price endpoint description + owner decision: the TradeETH gate stays
    // on the ':USLF24' ticker suffix like the reference cometd implementation
    expect(tradeTickers('AAPL:USLF24')).toEqual([
      { symbol: 'AAPL:USLF24', type: 'Trade' },
      { symbol: 'AAPL:USLF24', type: 'TradeETH' },
    ])
  })

  it('a bare ticker subscribes Trade only', () => {
    // Spec price endpoint description: "Symbols without an ETH session simply
    // yield no TradeETH events"
    expect(tradeTickers('SPCX')).toEqual([{ symbol: 'SPCX', type: 'Trade' }])
  })
})

describe('price ws path: newest-time selection across Trade / TradeETH (spec price endpoint description)', () => {
  it('when Trade and TradeETH both arrive, the record with the newer time wins', () => {
    const feed = priceFeed('AAPL:USLF24')

    // Spec sample Trade: t=1760000000000, price 189.98
    const trade = feed.message(frames.priceTradeFrame as any)
    expect(trade).toHaveLength(1)
    expect((trade[0] as any).result).toBe(189.98)
    expect((trade[0] as any).timestamps).toEqual({
      providerIndicatedTimeUnixMs: 1760000000000,
    })

    // A newer extended-hours record takes over: result=price, time=its own
    const extended = feed.message(tradeEthFrame('AAPL:USLF24', 1760000000500, 190.02))
    expect(extended).toHaveLength(1)
    expect((extended[0] as any).result).toBe(190.02)
    expect((extended[0] as any).timestamps).toEqual({
      providerIndicatedTimeUnixMs: 1760000000500,
    })

    // A late-arriving OLDER regular-hours record is dropped, never served
    const late = feed.message(tradeFrame('AAPL:USLF24', 1760000000200, 188))
    expect(late).toEqual([])
  })

  it('a symbol with no ETH session serves Trade', () => {
    const feed = priceFeed('SPCX')

    const trade = feed.message(tradeFrame('SPCX', 1760000000000, 189.98))
    expect(trade).toHaveLength(1)
    expect((trade[0] as any).result).toBe(189.98)
    expect((trade[0] as any).timestamps).toEqual({
      providerIndicatedTimeUnixMs: 1760000000000,
    })
  })
})
