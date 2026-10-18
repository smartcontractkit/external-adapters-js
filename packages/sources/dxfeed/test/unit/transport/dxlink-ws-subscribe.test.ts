import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { tradeTickers } from '../../../src/transport/price-ws'
import { quoteTickers } from '../../../src/transport/stock-quotes'
import { DxLinkFeed, DxLinkFeedDeps } from '../../../src/transport/ws'

// The transport modules log via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

/**
 * Plan item 3 proving test (spec price/stock_quotes data sources; framework
 * customSubscriptionMessages; owner decision tradeteth_subscription_policy =
 * match_reference): subscriptions build FEED_SUBSCRIPTION add/remove arrays
 * keyed per (symbol, eventType) on the FEED channel — Trade plus TradeETH for
 * the :USLF24-suffixed DP tickers, Trade only for bare tickers, Quote for
 * stock_quotes — the ticker-key dedupe collapses duplicates onto one wire
 * entry, and a simulated reconnect (the framework re-delivering the whole
 * desired set as `new`) replays the full add list.
 */
const feedFor = (formatTickers: DxLinkFeedDeps<any>['formatTickers']) =>
  new DxLinkFeed({
    formatTickers,
    processRecord: () => undefined,
  } as DxLinkFeedDeps<any>)

const priceFeed = () => feedFor((params: any) => tradeTickers(params.base))
const quoteFeed = () => feedFor((params: any) => quoteTickers(params.base))

describe('price subscription fanout (owner decision tradeteth=match_reference)', () => {
  it('subscribing AAPL:USLF24 on price emits add [{symbol, type: Trade}, {symbol, type: TradeETH}]', () => {
    // Spec price description: stream Trade (regular hours) AND TradeETH
    // (extended hours) for the symbol; the reference-gated TradeETH entry is
    // keyed on the :USLF24 suffix every DP override carries
    const params = { base: 'AAPL:USLF24', quote: 'USD' }
    expect(
      priceFeed().subscriptionMessages({ desired: [params], new: [params], stale: [] }),
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

  it('subscribing a bare ticker emits Trade only (no TradeETH entry)', () => {
    // Spec price description: "Symbols without an ETH session simply yield no
    // TradeETH events"; RDD: 100% of dxfeed overrides are {TICKER}:USLF24, so
    // bare tickers are the only affected shape
    const params = { base: 'SPCX', quote: 'USD' }
    expect(
      priceFeed().subscriptionMessages({ desired: [params], new: [params], stale: [] }),
    ).toEqual([
      {
        type: 'FEED_SUBSCRIPTION',
        channel: 1,
        add: [{ symbol: 'SPCX', type: 'Trade' }],
      },
    ])
  })

  it('a duplicate subscribe emits no second add — same params twice dedupe onto one wire entry per (symbol, eventType)', () => {
    // Two identical desired combos map onto the same wire keys; the dedupe
    // (reference ws.ts ticker-key logic) collapses them to one add entry each
    const params = { base: 'AAPL:USLF24', quote: 'USD' }
    expect(
      priceFeed().subscriptionMessages({
        desired: [params, params],
        new: [params, params],
        stale: [],
      }),
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

    // Case-differed bases uppercase onto the same wire key — still no second add
    const lower = { base: 'aapl:uslf24', quote: 'USD' }
    expect(
      priceFeed().subscriptionMessages({
        desired: [params, lower],
        new: [params, lower],
        stale: [],
      }),
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

  it('unsubscribing emits the matching remove array', () => {
    // Spec primary_command FEED_SUBSCRIPTION shape: remove entries keyed
    // (symbol, eventType), remove message on the FEED channel
    const stale = { base: 'AAPL:USLF24', quote: 'USD' }
    expect(priceFeed().subscriptionMessages({ desired: [], new: [], stale: [stale] })).toEqual([
      {
        type: 'FEED_SUBSCRIPTION',
        channel: 1,
        remove: [
          { symbol: 'AAPL:USLF24', type: 'Trade' },
          { symbol: 'AAPL:USLF24', type: 'TradeETH' },
        ],
      },
    ])
  })

  it('a simulated reconnect re-delivers the whole desired set as adds (framework reconnect resubscribe)', () => {
    const params = { base: 'AAPL:USLF24', quote: 'USD' }
    const feed = priceFeed()
    const desiredSet = [
      {
        type: 'FEED_SUBSCRIPTION',
        channel: 1,
        add: [
          { symbol: 'AAPL:USLF24', type: 'Trade' },
          { symbol: 'AAPL:USLF24', type: 'TradeETH' },
        ],
      },
    ]

    // First background execution subscribes...
    expect(feed.subscriptionMessages({ desired: [params], new: [params], stale: [] })).toEqual(
      desiredSet,
    )
    // ...and the reconnect re-subscribes the same set
    expect(feed.subscriptionMessages({ desired: [params], new: [params], stale: [] })).toEqual(
      desiredSet,
    )
  })
})

describe('stock_quotes subscription fanout (spec stock_quotes data source: stream Quote events)', () => {
  it('subscribing on stock_quotes emits a single Quote add entry', () => {
    const params = { base: 'AAPL:USLF24', quote: 'USD', requireVolume: false, isOvernight: false }
    expect(
      quoteFeed().subscriptionMessages({ desired: [params], new: [params], stale: [] }),
    ).toEqual([
      {
        type: 'FEED_SUBSCRIPTION',
        channel: 1,
        add: [{ symbol: 'AAPL:USLF24', type: 'Quote' }],
      },
    ])
  })

  it('unsubscribing a wire key still desired by another params combo emits no frames (requireVolume/isOvernight are not wire keys)', () => {
    const stillDesired = { base: 'TSLA', requireVolume: false, isOvernight: false }
    const nowStale = { base: 'TSLA', requireVolume: true, isOvernight: false }
    expect(
      quoteFeed().subscriptionMessages({ desired: [stillDesired], new: [], stale: [nowStale] }),
    ).toEqual([])
  })

  it('an unchanged desired set emits no FEED_SUBSCRIPTION frames (framework invokes the builder on a subscription delta only)', () => {
    const params = { base: 'TSLA', requireVolume: false, isOvernight: false }
    expect(quoteFeed().subscriptionMessages({ desired: [params], new: [], stale: [] })).toEqual([])
  })
})
