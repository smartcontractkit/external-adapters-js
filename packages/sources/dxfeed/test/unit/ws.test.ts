import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { DxLinkFeed, DxLinkFeedDeps } from '../../src/transport/ws'

// The feed logs via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

describe('DxLinkFeed record fan-out (successor of the legacy ticker-key dedupe coverage)', () => {
  const QUOTE_FIELDS = [
    'eventType',
    'eventSymbol',
    'time',
    'bidPrice',
    'askPrice',
    'bidSize',
    'askSize',
    'bidExchangeCode',
    'askExchangeCode',
  ]

  it('fans a wire key record out to every desired params combo mapped onto it', () => {
    const processed: any[] = []
    const feed = new DxLinkFeed({
      formatTickers: (params: any) => [
        { symbol: String(params.base).toUpperCase(), type: 'Quote' },
      ],
      processRecord: (_eventType, _record, params: any) => {
        processed.push(params)
        return { result: params.base, data: {} as any, timestamps: {} as any }
      },
    } as DxLinkFeedDeps<any>)

    const params1 = { base: 'tsla', requireVolume: false, isOvernight: false }
    const params2 = { base: 'TSLA', requireVolume: true, isOvernight: false }
    feed.onFeedConfig({ Quote: QUOTE_FIELDS })
    feed.subscriptionMessages({ desired: [params1, params2], new: [params1, params2], stale: [] })

    const out = feed.message({
      type: 'FEED_DATA',
      channel: 1,
      data: ['Quote', ['Quote', 'TSLA', 1760000000000, 189.95, 190.05, 100, 200, 'V', 'V']],
    } as any)

    expect(processed).toEqual([params1, params2])
    expect(out).toHaveLength(2)
    expect(out.map((r) => (r as any).result)).toEqual(['tsla', 'TSLA'])
  })

  it('does not fan out records for wire keys nobody is subscribed to', () => {
    const feed = new DxLinkFeed({
      formatTickers: (params: any) => [
        { symbol: String(params.base).toUpperCase(), type: 'Quote' },
      ],
      processRecord: () => ({ result: 0, data: {} as any, timestamps: {} as any }),
    } as DxLinkFeedDeps<any>)

    const params = { base: 'AAPL', requireVolume: false, isOvernight: false }
    feed.onFeedConfig({ Quote: QUOTE_FIELDS })
    feed.subscriptionMessages({ desired: [params], new: [params], stale: [] })

    // A frame for an un-subscribed symbol must not produce results for AAPL
    const out = feed.message({
      type: 'FEED_DATA',
      channel: 1,
      data: ['Quote', ['Quote', 'TSLA', 1760000000000, 189.95, 190.05, 100, 200, 'V', 'V']],
    } as any)

    expect(out).toEqual([])
  })
})
