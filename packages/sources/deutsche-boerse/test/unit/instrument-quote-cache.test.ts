import { InstrumentQuoteCache } from '../../src/transport/instrument-quote-cache'

describe('InstrumentQuoteCache', () => {
  const MARKET = 'md-tradegate'
  const MARKET2 = 'md-xetraetfetp'
  const ISIN = 'IE00B53L3W79'
  const ISIN2 = 'US0000000001'

  test('activate/deactivate/has/isEmpty/get', () => {
    const cache = new InstrumentQuoteCache()
    expect(cache.isEmpty()).toBe(true)
    expect(cache.hasMarket(MARKET)).toBe(false)
    expect(cache.getMarkets()).toEqual([])

    cache.activate(MARKET, ISIN)
    expect(cache.has(MARKET, ISIN)).toBe(true)
    expect(cache.get(MARKET, ISIN)).toEqual({})
    expect(cache.isEmpty()).toBe(false)
    expect(cache.hasMarket(MARKET)).toBe(true)
    expect(cache.getMarkets()).toEqual([MARKET])

    cache.deactivate(MARKET, ISIN)
    expect(cache.has(MARKET, ISIN)).toBe(false)
    expect(cache.isEmpty()).toBe(true)
    expect(cache.hasMarket(MARKET)).toBe(false)
    expect(cache.getMarkets()).toEqual([])
  })

  test('addQuote sets bid/ask/mid and quote time', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(MARKET, ISIN)

    cache.addQuote(MARKET, ISIN, 100, 102, 1234, 1000, 2000)
    const q = cache.get(MARKET, ISIN)!
    expect(q.bid).toBe(100)
    expect(q.ask).toBe(102)
    expect(q.mid).toBe(101)
    expect(q.bidSize).toBe(1000)
    expect(q.askSize).toBe(2000)
    expect(q.quoteProviderTimeUnixMs).toBe(1234)
  })

  test('addBid then addAsk recomputes mid and updates quote time', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(MARKET, ISIN)

    cache.addBid(MARKET, ISIN, 100, 1111, 500) // only bid
    let q = cache.get(MARKET, ISIN)!
    expect(q.bid).toBe(100)
    expect(q.ask).toBeUndefined()
    expect(q.mid).toBeUndefined()
    expect(q.bidSize).toBe(500)
    expect(q.askSize).toBeUndefined()
    expect(q.quoteProviderTimeUnixMs).toBe(1111)

    cache.addAsk(MARKET, ISIN, 102, 2222, 750) // now ask arrives
    q = cache.get(MARKET, ISIN)!
    expect(q.ask).toBe(102)
    expect(q.mid).toBe(101)
    expect(q.askSize).toBe(750)
    expect(q.quoteProviderTimeUnixMs).toBe(2222)
  })

  test('addAsk then addBid recomputes mid and updates quote time', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(MARKET, ISIN)

    cache.addAsk(MARKET, ISIN, 50, 3333, 300)
    let q = cache.get(MARKET, ISIN)!
    expect(q.ask).toBe(50)
    expect(q.mid).toBeUndefined()
    expect(q.askSize).toBe(300)

    cache.addBid(MARKET, ISIN, 48, 4444, 400)
    q = cache.get(MARKET, ISIN)!
    expect(q.bid).toBe(48)
    expect(q.mid).toBe(49)
    expect(q.bidSize).toBe(400)
    expect(q.quoteProviderTimeUnixMs).toBe(4444)
  })

  test('addTrade sets latestPrice and trade time', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(MARKET, ISIN)

    cache.addTrade(MARKET, ISIN, 99.5, 2222)
    const q = cache.get(MARKET, ISIN)!
    expect(q.latestPrice).toBe(99.5)
    expect(q.tradeProviderTimeUnixMs).toBe(2222)
  })

  test('addQuote/addBid/addAsk/addTrade without activate throws', () => {
    const cache = new InstrumentQuoteCache()
    expect(() => cache.addQuote(MARKET, ISIN, 100, 102, 1234, 500, 600)).toThrow(
      /inactive instrument/i,
    )
    expect(() => cache.addBid(MARKET, ISIN, 100, 1)).toThrow(/inactive isin/i)
    expect(() => cache.addAsk(MARKET, ISIN, 100, 1)).toThrow(/inactive isin/i)
    expect(() => cache.addTrade(MARKET, ISIN, 99.5, 2222)).toThrow(/inactive instrument/i)
  })

  test('deactivate then attempt to add -> throws', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(MARKET, ISIN)
    cache.deactivate(MARKET, ISIN)
    expect(() => cache.addQuote(MARKET, ISIN, 1, 2, 3, 4, 5)).toThrow(/inactive instrument/i)
    expect(() => cache.addTrade(MARKET, ISIN, 1, 3)).toThrow(/inactive instrument/i)
  })

  test('mid is computed correctly for equal sides and edge values', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(MARKET, ISIN)
    cache.addQuote(MARKET, ISIN, 0, 0, 123, 100, 200)
    const q = cache.get(MARKET, ISIN)!
    expect(q.bid).toBe(0)
    expect(q.ask).toBe(0)
    expect(q.mid).toBe(0)
    expect(q.bidSize).toBe(100)
    expect(q.askSize).toBe(200)
    expect(q.quoteProviderTimeUnixMs).toBe(123)
  })

  test('multiple instruments lifecycle', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(MARKET, ISIN)
    cache.activate(MARKET2, ISIN2)
    expect(cache.has(MARKET, ISIN)).toBe(true)
    expect(cache.has(MARKET2, ISIN2)).toBe(true)
    expect(cache.hasMarket(MARKET)).toBe(true)
    expect(cache.hasMarket(MARKET2)).toBe(true)
    expect(cache.getMarkets().sort()).toEqual([MARKET, MARKET2].sort())
    expect(cache.isEmpty()).toBe(false)

    cache.addQuote(MARKET, ISIN, 100, 101, 10, 1500, 1600)
    cache.addTrade(MARKET2, ISIN2, 55, 20)

    const q1 = cache.get(MARKET, ISIN)!
    const q2 = cache.get(MARKET2, ISIN2)!

    expect(q1.mid).toBe(100.5)
    expect(q1.bidSize).toBe(1500)
    expect(q1.askSize).toBe(1600)
    expect(q1.quoteProviderTimeUnixMs).toBe(10)
    expect(q2.latestPrice).toBe(55)
    expect(q2.tradeProviderTimeUnixMs).toBe(20)

    cache.deactivate(MARKET, ISIN)
    expect(cache.has(MARKET, ISIN)).toBe(false)
    expect(cache.hasMarket(MARKET)).toBe(false)
    expect(cache.hasMarket(MARKET2)).toBe(true)
    expect(cache.getMarkets()).toEqual([MARKET2])
    expect(cache.isEmpty()).toBe(false)

    cache.deactivate(MARKET2, ISIN2)
    expect(cache.getMarkets()).toEqual([])
    expect(cache.isEmpty()).toBe(true)
  })

  test('same ISIN in different markets are stored separately', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(MARKET, ISIN)
    cache.activate(MARKET2, ISIN) // Same ISIN, different market
    expect(cache.hasMarket(MARKET)).toBe(true)
    expect(cache.hasMarket(MARKET2)).toBe(true)
    expect(cache.getMarkets().sort()).toEqual([MARKET, MARKET2].sort())

    cache.addQuote(MARKET, ISIN, 100, 101, 10, 800, 900)
    cache.addTrade(MARKET2, ISIN, 200, 20)

    const q1 = cache.get(MARKET, ISIN)!
    const q2 = cache.get(MARKET2, ISIN)!

    expect(q1.mid).toBe(100.5)
    expect(q1.bidSize).toBe(800)
    expect(q1.askSize).toBe(900)
    expect(q1.quoteProviderTimeUnixMs).toBe(10)
    expect(q1.latestPrice).toBeUndefined() // No trade data for this market

    expect(q2.latestPrice).toBe(200)
    expect(q2.tradeProviderTimeUnixMs).toBe(20)
    expect(q2.mid).toBeUndefined() // No quote data for this market
    expect(q2.bidSize).toBeUndefined()
    expect(q2.askSize).toBeUndefined()

    expect(cache.isEmpty()).toBe(false)
    cache.deactivate(MARKET, ISIN)
    expect(cache.has(MARKET, ISIN)).toBe(false)
    expect(cache.hasMarket(MARKET)).toBe(false)
    expect(cache.hasMarket(MARKET2)).toBe(true) // Other market still active
    expect(cache.getMarkets()).toEqual([MARKET2])
    expect(cache.isEmpty()).toBe(false)

    cache.deactivate(MARKET2, ISIN)
    expect(cache.getMarkets()).toEqual([])
    expect(cache.isEmpty()).toBe(true)
  })

  test('bidSize and askSize are properly handled for individual bid/ask updates', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(MARKET, ISIN)

    // Add bid with size
    cache.addBid(MARKET, ISIN, 95, 1000, 1200)
    let q = cache.get(MARKET, ISIN)!
    expect(q.bid).toBe(95)
    expect(q.bidSize).toBe(1200)
    expect(q.ask).toBeUndefined()
    expect(q.askSize).toBeUndefined()

    // Add ask with size
    cache.addAsk(MARKET, ISIN, 105, 2000, 1300)
    q = cache.get(MARKET, ISIN)!
    expect(q.ask).toBe(105)
    expect(q.askSize).toBe(1300)
    expect(q.mid).toBe(100)
    expect(q.quoteProviderTimeUnixMs).toBe(2000)

    // Update bid without size (should be undefined)
    cache.addBid(MARKET, ISIN, 96, 3000)
    q = cache.get(MARKET, ISIN)!
    expect(q.bid).toBe(96)
    expect(q.bidSize).toBeUndefined()
    expect(q.mid).toBe(100.5)

    // Update ask without size (should be undefined)
    cache.addAsk(MARKET, ISIN, 106, 4000)
    q = cache.get(MARKET, ISIN)!
    expect(q.ask).toBe(106)
    expect(q.askSize).toBeUndefined()
    expect(q.mid).toBe(101)
    expect(q.quoteProviderTimeUnixMs).toBe(4000)
  })

  test('activate is idempotent and does not duplicate markets', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(MARKET, ISIN)
    cache.activate(MARKET, ISIN) // duplicate activate
    expect(cache.has(MARKET, ISIN)).toBe(true)
    expect(cache.hasMarket(MARKET)).toBe(true)
    expect(cache.getMarkets()).toEqual([MARKET]) // still a single market entry
  })

  test('hasMarket remains true until the last instrument in that market is removed', () => {
    const cache = new InstrumentQuoteCache()
    const ISIN_A = 'DE0001234567'
    const ISIN_B = 'DE0007654321'
    cache.activate(MARKET, ISIN_A)
    cache.activate(MARKET, ISIN_B)
    expect(cache.hasMarket(MARKET)).toBe(true)

    cache.deactivate(MARKET, ISIN_A)
    expect(cache.hasMarket(MARKET)).toBe(true) // still one instrument left

    cache.deactivate(MARKET, ISIN_B)
    expect(cache.hasMarket(MARKET)).toBe(false) // now empty
  })

  test('getMarkets excludes markets whose last instrument was removed', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(MARKET, ISIN)
    cache.activate(MARKET2, ISIN2)
    expect(cache.getMarkets().sort()).toEqual([MARKET, MARKET2].sort())

    // Remove MARKET completely; MARKET2 remains
    cache.deactivate(MARKET, ISIN)
    expect(cache.getMarkets()).toEqual([MARKET2])

    // Remove MARKET2 as well
    cache.deactivate(MARKET2, ISIN2)
    expect(cache.getMarkets()).toEqual([])
  })

  test('deactivating unknown instrument is a no-op and does not throw', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(MARKET, ISIN)
    expect(() => cache.deactivate(MARKET, 'UNKNOWN_ISIN')).not.toThrow()
    expect(cache.hasMarket(MARKET)).toBe(true)
    expect(cache.has(MARKET, ISIN)).toBe(true)
  })

  test('get returns undefined for unknown or deactivated pairs', () => {
    const cache = new InstrumentQuoteCache()
    expect(cache.get(MARKET, ISIN)).toBeUndefined()

    cache.activate(MARKET, ISIN)
    expect(cache.get(MARKET, 'UNKNOWN')).toBeUndefined()

    cache.deactivate(MARKET, ISIN)
    expect(cache.get(MARKET, ISIN)).toBeUndefined()
  })

  test('reactivating an instrument yields a fresh empty quote object', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(MARKET, ISIN)
    cache.addQuote(MARKET, ISIN, 10, 12, 1000, 1, 2)
    let q = cache.get(MARKET, ISIN)!
    expect(q.mid).toBe(11)

    cache.deactivate(MARKET, ISIN)
    expect(cache.get(MARKET, ISIN)).toBeUndefined()

    cache.activate(MARKET, ISIN)
    q = cache.get(MARKET, ISIN)!
    expect(q).toEqual({}) // no stale data carried over
  })

  test('mid computation remains precise with large numeric values', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(MARKET, ISIN)
    // use large numbers to ensure Decimal-based mid is computed correctly
    cache.addBid(MARKET, ISIN, 1_234_567_890_123.25, 1)
    cache.addAsk(MARKET, ISIN, 1_234_567_890_125.75, 2)
    const q = cache.get(MARKET, ISIN)!
    expect(q.mid).toBe(1_234_567_890_124.5)
  })

  test('clears all entries and is idempotent', () => {
    const cache = new InstrumentQuoteCache() as any
    // Access private map in tests via `as any` to avoid changing prod code
    cache.map.set('ABC', { bid: 1, ask: 2 })
    cache.map.set('DEF', { bid: 3, ask: 4 })
    expect(cache.map.size).toBe(2)

    cache.clear()
    expect(cache.map.size).toBe(0)

    // second call does nothing harmful
    cache.clear()
    expect(cache.map.size).toBe(0)
  })
})
