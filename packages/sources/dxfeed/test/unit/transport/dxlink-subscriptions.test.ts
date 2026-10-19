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

describe('merged: dxlink-ws-subscribe.test', () => {
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
      expect(quoteFeed().subscriptionMessages({ desired: [params], new: [], stale: [] })).toEqual(
        [],
      )
    })
  })
})

describe('merged: subscriptions.test', () => {
  // The transport modules log via the framework logger, which needs a factory set
  LoggerFactoryProvider.set()

  /**
   * Plan round1-subscription-fanout proving test: subscriptions fan out to
   * dxLink FEED_SUBSCRIPTION add/remove arrays per (symbol, eventType), on the
   * FEED channel the spec primary_command requests (CHANNEL_REQUEST channel 1).
   * Each case drives the real production wiring: the endpoints' exported ticker
   * mappers (stock_quotes -> Quote; price -> Trade, plus TradeETH only for the
   * :USLF24 extended-hours tickers per owner decision
   * tradeteth_subscription_policy=match_reference).
   */
  const feedFor = (formatTickers: DxLinkFeedDeps<any>['formatTickers']) =>
    new DxLinkFeed({
      formatTickers,
      processRecord: () => undefined,
    } as DxLinkFeedDeps<any>)

  const quoteFeed = () => feedFor((params: any) => quoteTickers(params.base))
  const priceFeed = () => feedFor((params: any) => tradeTickers(params.base))

  describe('FEED_SUBSCRIPTION fanout (plan round1-subscription-fanout / spec primary_command)', () => {
    it('an AAPL:USLF24 price subscription emits add entries for BOTH Trade and TradeETH', () => {
      // Spec price endpoint description: stream Trade AND TradeETH events;
      // owner decision match_reference keeps the TradeETH gate on :USLF24
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

    it('a bare-ticker price subscription emits Trade only (no TradeETH entry)', () => {
      // Spec price endpoint description: "Symbols without an ETH session simply
      // yield no TradeETH events"
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

    it('a stock_quotes subscription emits Quote only', () => {
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

    it('unsubscribing emits the matching FEED_SUBSCRIPTION remove array per event type', () => {
      const stalePrice = { base: 'AAPL:USLF24', quote: 'USD' }
      expect(
        priceFeed().subscriptionMessages({ desired: [], new: [], stale: [stalePrice] }),
      ).toEqual([
        {
          type: 'FEED_SUBSCRIPTION',
          channel: 1,
          remove: [
            { symbol: 'AAPL:USLF24', type: 'Trade' },
            { symbol: 'AAPL:USLF24', type: 'TradeETH' },
          ],
        },
      ])

      const staleQuote = { base: 'TSLA', quote: 'USD' }
      expect(
        quoteFeed().subscriptionMessages({ desired: [], new: [], stale: [staleQuote] }),
      ).toEqual([
        {
          type: 'FEED_SUBSCRIPTION',
          channel: 1,
          remove: [{ symbol: 'TSLA', type: 'Quote' }],
        },
      ])
    })

    it('a resubscribe after reconnect replays the full desired set as adds', () => {
      // Spec framework_alignment reconnect_resubscribe: on reconnect the framework
      // re-delivers the whole desired set as `new` and the builder re-sends every
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

    it('duplicate params combos resolving onto one (symbol, eventType) key dedupe to a single add entry', () => {
      // Plan item 3 fix_shape: "Key dedupe per (symbol, eventType) reusing the
      // current ws.ts ticker-key logic" — two case-differed bases share one wire key
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
    })
  })
})
