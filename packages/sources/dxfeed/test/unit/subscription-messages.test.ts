import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { tradeTickers } from '../../src/transport/price-ws'
import { DxLinkFeed, DxLinkFeedDeps } from '../../src/transport/ws'

LoggerFactoryProvider.set()

const quoteFeed = () =>
  new DxLinkFeed({
    formatTickers: (params: any) => [{ symbol: String(params.base).toUpperCase(), type: 'Quote' }],
    processRecord: () => undefined,
  } as DxLinkFeedDeps<any>)

const tradeFeed = () =>
  new DxLinkFeed({
    formatTickers: (params: any) => tradeTickers(params.base),
    processRecord: () => undefined,
  } as DxLinkFeedDeps<any>)

describe('FEED_SUBSCRIPTION message building (spec primary_command: FEED_SUBSCRIPTION add/remove)', () => {
  it('sends one add entry for params combos that collapse onto the same wire key', () => {
    const feed = quoteFeed()
    const params1 = { base: 'tsla', requireVolume: false, isOvernight: false }
    const params2 = { base: 'TSLA', requireVolume: true, isOvernight: false }

    const messages = feed.subscriptionMessages({
      desired: [params1, params2],
      new: [params1, params2],
      stale: [],
    })

    expect(messages).toEqual([
      { type: 'FEED_SUBSCRIPTION', channel: 1, add: [{ symbol: 'TSLA', type: 'Quote' }] },
    ])
  })

  it('does not unsubscribe a wire key still desired by another params combo', () => {
    const feed = quoteFeed()
    const stillDesired = { base: 'TSLA', requireVolume: false, isOvernight: false }
    const nowStale = { base: 'TSLA', requireVolume: true, isOvernight: false }

    const messages = feed.subscriptionMessages({
      desired: [stillDesired],
      new: [],
      stale: [nowStale],
    })

    expect(messages).toEqual([])
  })

  it('sends a remove entry for a wire key no longer desired by any params combo', () => {
    const feed = quoteFeed()
    const nowStale = { base: 'TSLA', requireVolume: false, isOvernight: false }

    const messages = feed.subscriptionMessages({ desired: [], new: [], stale: [nowStale] })

    expect(messages).toEqual([
      { type: 'FEED_SUBSCRIPTION', channel: 1, remove: [{ symbol: 'TSLA', type: 'Quote' }] },
    ])
  })

  it('builds remove-then-add messages for a delta containing both', () => {
    const feed = quoteFeed()
    const newSub = { base: 'AAPL', requireVolume: false, isOvernight: false }
    const staleSub = { base: 'TSLA', requireVolume: false, isOvernight: false }

    const messages = feed.subscriptionMessages({
      desired: [newSub],
      new: [newSub],
      stale: [staleSub],
    })

    expect(messages).toEqual([
      { type: 'FEED_SUBSCRIPTION', channel: 1, remove: [{ symbol: 'TSLA', type: 'Quote' }] },
      { type: 'FEED_SUBSCRIPTION', channel: 1, add: [{ symbol: 'AAPL', type: 'Quote' }] },
    ])
  })

  it('sends no messages when there is no subscription delta', () => {
    const feed = quoteFeed()
    const params = { base: 'TSLA', requireVolume: false, isOvernight: false }

    expect(feed.subscriptionMessages({ desired: [params], new: [], stale: [] })).toEqual([])
  })

  it('subscribes TradeETH only for the :USLF24 extended-hours tickers (owner decision match_reference)', () => {
    const feed = tradeFeed()
    const params = { base: 'AAPL:USLF24', quote: 'USD' }

    const messages = feed.subscriptionMessages({ desired: [params], new: [params], stale: [] })

    expect(messages).toEqual([
      {
        type: 'FEED_SUBSCRIPTION',
        channel: 1,
        add: [
          { symbol: 'AAPL:USLF24', type: 'Trade' },
          { symbol: 'AAPL:USLF24', type: 'TradeETH' },
        ],
      },
    ])

    // Regular-hours-only tickers get exactly one Trade entry
    expect(tradeTickers('SPCX')).toEqual([{ symbol: 'SPCX', type: 'Trade' }])
  })
})
