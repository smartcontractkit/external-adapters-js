import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { tradeTickers } from '../../../src/transport/price-ws'
import { quoteTickers } from '../../../src/transport/stock-quotes'
import { DxLinkFeed, DxLinkFeedDeps } from '../../../src/transport/ws'

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
