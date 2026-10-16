import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { tradeTickers } from '../../src/transport/price-ws'
import { quoteTickers } from '../../src/transport/stock-quotes'
import { DxLinkFeed, DxLinkFeedDeps } from '../../src/transport/ws'

// The transport modules log via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

/**
 * Plan round1-subscriptions proving test: subscriptions fan out to dxLink
 * FEED_SUBSCRIPTION messages per (symbol, eventType), spec primary_command
 * FEED_SUBSCRIPTION on the FEED channel. Each case drives the REAL production
 * wiring: the endpoints' exported ticker mappers (stock_quotes -> Quote,
 * price -> Trade/TradeETH) fed into the transport's DxLinkFeed message builder.
 */
const feedFor = (formatTickers: DxLinkFeedDeps<any>['formatTickers']) =>
  new DxLinkFeed({
    formatTickers,
    processRecord: () => undefined,
  } as DxLinkFeedDeps<any>)

const quoteFeed = () => feedFor((params: any) => quoteTickers(params.base))
const priceFeed = () => feedFor((params: any) => tradeTickers(params.base))

describe('FEED_SUBSCRIPTION fanout (plan round1-subscriptions / spec primary_command FEED_SUBSCRIPTION)', () => {
  it('subscribing AAPL:USLF24 emits the Quote add (stock_quotes) AND the Trade+TradeETH adds (price)', () => {
    // stock_quotes streams Quote events for the symbol (spec stock_quotes data source)
    const stockQuotesParams = { base: 'AAPL:USLF24', quote: 'USD' }
    expect(
      quoteFeed().subscriptionMessages({
        desired: [stockQuotesParams],
        new: [stockQuotesParams],
        stale: [],
      }),
    ).toEqual([
      {
        type: 'FEED_SUBSCRIPTION',
        channel: 1,
        add: [{ symbol: 'AAPL:USLF24', type: 'Quote' }],
      },
    ])

    // price streams BOTH Trade (regular) and TradeETH (extended) for the same
    // symbol (spec price endpoint description)
    const priceParams = { base: 'AAPL:USLF24', quote: 'USD' }
    expect(
      priceFeed().subscriptionMessages({
        desired: [priceParams],
        new: [priceParams],
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

  it('a bare ticker emits Trade only on the price path (owner decision tradeteth_subscription_policy=match_reference)', () => {
    // Only :USLF24-suffixed tickers get the TradeETH entry; symbols without an
    // ETH session simply yield no TradeETH events (harmless)
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

  it('unsubscribing emits the matching FEED_SUBSCRIPTION remove array', () => {
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
  })

  it('duplicate subscriptions for one ticker dedupe to a single add entry', () => {
    // Two live request params combos resolving onto the same (symbol, eventType)
    // wire key — case-differed tickers on the quote path — must not double-subscribe
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

    // Same for two identical price-path combos (Trade + TradeETH each appear once)
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
})
