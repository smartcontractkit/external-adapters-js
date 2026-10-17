import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { tradeProcessor } from '../../src/transport/price-ws'
import { quoteRecordToResult } from '../../src/transport/stock-quotes'
import { DxLinkFeed, DxLinkFeedDeps } from '../../src/transport/ws'
import frames from './fixtures/dxlink-frames.json'

LoggerFactoryProvider.set()

const QUOTE_PARAMS = { base: 'AAPL:USLF24', requireVolume: false, isOvernight: false }
const TRADE_PARAMS = { base: 'AAPL:USLF24', quote: 'USD' }

const quoteFeed = () => {
  const feed = new DxLinkFeed({
    formatTickers: () => [{ symbol: 'AAPL:USLF24', type: 'Quote' }],
    processRecord: (eventType, record, params: any) =>
      eventType === 'Quote' ? quoteRecordToResult(record, params) : undefined,
  } as DxLinkFeedDeps<any>)
  // FEED_CONFIG field order first (the open gate hands this over), then the
  // subscription index (normally populated by the custom builder)
  feed.onFeedConfig(frames.quoteFeedConfig.eventFields)
  feed.subscriptionMessages({ desired: [QUOTE_PARAMS], new: [QUOTE_PARAMS], stale: [] })
  return feed
}

describe('COMPACT FEED_DATA parsing (spec acceptDataFormat=COMPACT)', () => {
  it('splits the Quote sample frame positionally and keeps the first record per wire key', () => {
    const results = quoteFeed().message(frames.stockQuotesFrame as any)

    expect(results).toHaveLength(1)
    const response = results[0] as any
    expect(response.result).toBe(190)
    expect(response.data).toEqual({
      mid_price: 190,
      bid_price: 189.95,
      bid_volume: 100,
      ask_price: 190.05,
      ask_volume: 200,
    })
    expect(response.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
  })

  it('errors (502) on a record whose quote value is the "NaN" string', () => {
    const results = quoteFeed().message(frames.stockQuotesInvalidFrame as any)

    expect(results).toHaveLength(1)
    const error = results[0] as any
    expect(error.statusCode).toBe(502)
    expect(error.errorMessage).toContain('invalid')
  })

  it('truncates a trailing partial record instead of misparsing it', () => {
    const feed = quoteFeed()
    const partialFrame = {
      type: 'FEED_DATA',
      channel: 1,
      data: [
        'Quote',
        [
          ...frames.stockQuotesFrame.data[1].slice(0, 9),
          // a second record missing its last 5 fields
          'Quote',
          'AAPL:USLF24',
          1760000002000,
          1,
        ],
      ],
    }

    const results = feed.message(partialFrame as any)
    expect(results).toHaveLength(1)
    expect((results[0] as any).data.bid_price).toBe(189.95)
  })

  it('strips NUL padding from string fields before mapping the wire symbol', () => {
    const feed = quoteFeed()
    const paddedFrame = {
      type: 'FEED_DATA',
      channel: 1,
      data: [
        'Quote',
        ['Quote', 'AAPL:USLF24\x00', 1760000000000, 189.95, 190.05, 100, 200, 'V', 'V'],
      ],
    }

    const results = feed.message(paddedFrame as any)
    expect(results).toHaveLength(1)
    expect((results[0] as any).data.mid_price).toBe(190)
  })

  it('produces no results for ERROR, KEEPALIVE and CHANNEL_CLOSED control frames', () => {
    const feed = quoteFeed()
    for (const frame of [frames.errorFrame, frames.keepaliveFrame, frames.channelClosedFrame]) {
      expect(feed.message(frame as any)).toEqual([])
    }
  })

  it('serves the newest-time record when both Trade and TradeETH exist for a symbol', () => {
    const feed = new DxLinkFeed({
      formatTickers: () => [
        { symbol: 'AAPL:USLF24', type: 'Trade' },
        { symbol: 'AAPL:USLF24', type: 'TradeETH' },
      ],
      processRecord: (eventType, record, params: any) =>
        tradeProcessor.processRecord(eventType, record, params),
    } as DxLinkFeedDeps<any>)
    feed.onFeedConfig(frames.priceFeedConfig.eventFields)
    feed.subscriptionMessages({ desired: [TRADE_PARAMS], new: [TRADE_PARAMS], stale: [] })

    const tradeResults = feed.message(frames.priceTradeFrame as any)
    // Spec endpoint_request_response_examples[1]: {"data": {"result": 189.98}, "result": 189.98}
    expect((tradeResults[0] as any).result).toBe(189.98)
    expect((tradeResults[0] as any).data).toEqual({ result: 189.98 })
    // Spec endpoint_request_response_examples[1]: providerIndicatedTimeUnixMs 1760000000000
    expect((tradeResults[0] as any).timestamps).toEqual({
      providerIndicatedTimeUnixMs: 1760000000000,
    })

    const extendedFrame = {
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
    }
    const newer = feed.message(extendedFrame as any)
    expect((newer[0] as any).result).toBe(190.02)

    // A late-arriving older record is dropped, not served
    const lateFrame = {
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
    }
    expect(feed.message(lateFrame as any)).toEqual([])
  })
})
