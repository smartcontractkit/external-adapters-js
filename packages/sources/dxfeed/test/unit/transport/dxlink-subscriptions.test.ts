import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { tradeTickers } from '../../../src/transport/price-ws'
import { quoteTickers } from '../../../src/transport/stock-quotes'
import { DxLinkFeed, DxLinkFeedDeps } from '../../../src/transport/ws'

// The transport modules log via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

/**
 * Plan round1-transport-subscription-fanout proving test (spec primary_command
 * FEED_SUBSCRIPTION on the FEED channel; framework customSubscriptionMessages):
 * subscriptions fan out to FEED_SUBSCRIPTION add/remove arrays per (symbol,
 * eventType), price subscribes Trade and TradeETH (owner decision
 * tradeteth_subscription_policy=match_reference: TradeETH only on the :USLF24
 * suffix), stock_quotes subscribes Quote, the ticker-key dedupe collapses
 * duplicates onto one wire entry, and a simulated reconnect replays the whole
 * desired set as adds.
 */
const feedFor = (formatTickers: DxLinkFeedDeps<any>['formatTickers']) =>
  new DxLinkFeed({
    formatTickers,
    processRecord: () => undefined,
  } as DxLinkFeedDeps<any>)

const quoteFeed = () => feedFor((params: any) => quoteTickers(params.base))
const priceFeed = () => feedFor((params: any) => tradeTickers(params.base))

describe('FEED_SUBSCRIPTION fanout (spec primary_command; framework customSubscriptionMessages)', () => {
  it('an AAPL:USLF24 price subscription yields Trade AND TradeETH add entries', () => {
    // Spec price endpoint description: stream Trade AND TradeETH events; owner
    // decision match_reference keeps the TradeETH gate on :USLF24
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

  it('a bare ticker yields Trade only (no TradeETH entry)', () => {
    // Spec price endpoint description: "Symbols without an ETH session simply
    // yield no TradeETH events (harmful-free)"
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

  it('a stock_quotes subscription yields Quote only', () => {
    // Spec stock_quotes data source: stream Quote events for the symbol
    const params = { base: 'AAPL:USLF24', quote: 'USD' }
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

  it('unsubscribing yields the matching FEED_SUBSCRIPTION remove entries', () => {
    const stalePrice = { base: 'AAPL:USLF24', quote: 'USD' }
    expect(priceFeed().subscriptionMessages({ desired: [], new: [], stale: [stalePrice] })).toEqual(
      [
        {
          type: 'FEED_SUBSCRIPTION',
          channel: 1,
          remove: [
            { symbol: 'AAPL:USLF24', type: 'Trade' },
            { symbol: 'AAPL:USLF24', type: 'TradeETH' },
          ],
        },
      ],
    )

    const staleQuote = { base: 'TSLA', quote: 'USD' }
    expect(quoteFeed().subscriptionMessages({ desired: [], new: [], stale: [staleQuote] })).toEqual(
      [
        {
          type: 'FEED_SUBSCRIPTION',
          channel: 1,
          remove: [{ symbol: 'TSLA', type: 'Quote' }],
        },
      ],
    )
  })

  it('a simulated reconnect replays the full desired set as adds', () => {
    // Spec framework_alignment reconnect_resubscribe: on reconnect the framework
    // delivers the whole desired set as `new`, and the builder re-sends every
    // (symbol, eventType) entry of it
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

    // First background execution subscribes the desired set...
    expect(feed.subscriptionMessages({ desired: [params], new: [params], stale: [] })).toEqual(
      desiredSet,
    )

    // ...and after the reconnect the same desired set arrives again as `new`
    expect(feed.subscriptionMessages({ desired: [params], new: [params], stale: [] })).toEqual(
      desiredSet,
    )
  })

  it('duplicate params combos resolving onto one (symbol, eventType) key dedupe to a single add entry (reference ws.ts ticker-key logic)', () => {
    // Two case-differed bases share one wire key — no double-subscribe
    const params1 = { base: 'tsla', quote: 'USD' }
    const params2 = { base: 'TSLA', quote: 'USD' }
    expect(
      quoteFeed().subscriptionMessages({
        desired: [params1, params2],
        new: [params1, params2],
        stale: [],
      }),
    ).toEqual([
      {
        type: 'FEED_SUBSCRIPTION',
        channel: 1,
        add: [{ symbol: 'TSLA', type: 'Quote' }],
      },
    ])

    // Same dedupe on the price path: Trade and TradeETH each appear exactly once
    const tradeParams1 = { base: 'AAPL:USLF24', quote: 'USD' }
    const tradeParams2 = { base: 'aapl:uslf24', quote: 'USD' }
    expect(
      priceFeed().subscriptionMessages({
        desired: [tradeParams1, tradeParams2],
        new: [tradeParams1, tradeParams2],
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

  it('never unsubscribes a wire key still desired by another params combo, and emits remove-then-add for a mixed delta', () => {
    const feed = quoteFeed()
    const stillDesired = { base: 'TSLA', requireVolume: false, isOvernight: false }
    const nowStale = { base: 'TSLA', requireVolume: true, isOvernight: false }

    // The wire key stays desired (requireVolume/isOvernight are not wire keys)
    expect(
      feed.subscriptionMessages({ desired: [stillDesired], new: [], stale: [nowStale] }),
    ).toEqual([])

    // A delta carrying both sides emits remove before add
    const newSub = { base: 'AAPL', requireVolume: false, isOvernight: false }
    const staleSub = { base: 'TSLA', requireVolume: false, isOvernight: false }
    expect(
      feed.subscriptionMessages({ desired: [newSub], new: [newSub], stale: [staleSub] }),
    ).toEqual([
      { type: 'FEED_SUBSCRIPTION', channel: 1, remove: [{ symbol: 'TSLA', type: 'Quote' }] },
      { type: 'FEED_SUBSCRIPTION', channel: 1, add: [{ symbol: 'AAPL', type: 'Quote' }] },
    ])
  })

  it('an unchanged desired set emits no FEED_SUBSCRIPTION frames', () => {
    // The pinned framework 2.20.0 invokes customSubscriptionMessages solely
    // inside its subscription-diff branch: no delta, no frames
    const feed = quoteFeed()
    const params = { base: 'TSLA', requireVolume: false, isOvernight: false }
    expect(feed.subscriptionMessages({ desired: [params], new: [], stale: [] })).toEqual([])
  })
})
