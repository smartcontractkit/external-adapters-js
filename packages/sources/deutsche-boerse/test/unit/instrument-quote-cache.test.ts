import { InstrumentQuoteCache } from '../../src/transport/instrument-quote-cache'

describe('InstrumentQuoteCache', () => {
  const MARKET = 'md-tradegate'
  const MARKET2 = 'md-xetraetfetp'
  const ISIN = 'IE00B53L3W79'
  const ISIN2 = 'US0000000001'

  test('activate/deactivate/has/isEmpty/get', () => {
    const cache = new InstrumentQuoteCache()
    expect(cache.isEmpty()).toBe(true)
    cache.activate(MARKET, ISIN)
    expect(cache.has(MARKET, ISIN)).toBe(true)
    expect(cache.get(MARKET, ISIN)).toEqual({})
    expect(cache.isEmpty()).toBe(false)
    cache.deactivate(MARKET, ISIN)
    expect(cache.has(MARKET, ISIN)).toBe(false)
    expect(cache.isEmpty()).toBe(true)
  })

  test('addQuote sets bid/ask/mid and quote time', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(MARKET, ISIN)

    cache.addQuote(MARKET, ISIN, 100, 102, 1234)
    const q = cache.get(MARKET, ISIN)!
    expect(q.bid).toBe(100)
    expect(q.ask).toBe(102)
    expect(q.mid).toBe(101)
    expect(q.quoteProviderTimeUnixMs).toBe(1234)
  })

  test('addBid then addAsk recomputes mid and updates quote time', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(MARKET, ISIN)

    cache.addBid(MARKET, ISIN, 100, 1111) // only bid
    let q = cache.get(MARKET, ISIN)!
    expect(q.bid).toBe(100)
    expect(q.ask).toBeUndefined()
    expect(q.mid).toBeUndefined()
    expect(q.quoteProviderTimeUnixMs).toBe(1111)

    cache.addAsk(MARKET, ISIN, 102, 2222) // now ask arrives
    q = cache.get(MARKET, ISIN)!
    expect(q.ask).toBe(102)
    expect(q.mid).toBe(101)
    expect(q.quoteProviderTimeUnixMs).toBe(2222)
  })

  test('addAsk then addBid recomputes mid and updates quote time', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(MARKET, ISIN)

    cache.addAsk(MARKET, ISIN, 50, 3333)
    let q = cache.get(MARKET, ISIN)!
    expect(q.ask).toBe(50)
    expect(q.mid).toBeUndefined()

    cache.addBid(MARKET, ISIN, 48, 4444)
    q = cache.get(MARKET, ISIN)!
    expect(q.bid).toBe(48)
    expect(q.mid).toBe(49)
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
    expect(() => cache.addQuote(MARKET, ISIN, 100, 102, 1234)).toThrow(/inactive isin/i)
    expect(() => cache.addBid(MARKET, ISIN, 100, 1)).toThrow(/inactive isin/i)
    expect(() => cache.addAsk(MARKET, ISIN, 100, 1)).toThrow(/inactive isin/i)
    expect(() => cache.addTrade(MARKET, ISIN, 99.5, 2222)).toThrow(/inactive isin/i)
  })

  test('deactivate then attempt to add -> throws', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(MARKET, ISIN)
    cache.deactivate(MARKET, ISIN)
    expect(() => cache.addQuote(MARKET, ISIN, 1, 2, 3)).toThrow(/inactive instrument/i)
    expect(() => cache.addTrade(MARKET, ISIN, 1, 3)).toThrow(/inactive instrument/i)
  })

  test('mid is computed correctly for equal sides and edge values', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(MARKET, ISIN)
    cache.addQuote(MARKET, ISIN, 0, 0, 123)
    const q = cache.get(MARKET, ISIN)!
    expect(q.bid).toBe(0)
    expect(q.ask).toBe(0)
    expect(q.mid).toBe(0)
    expect(q.quoteProviderTimeUnixMs).toBe(123)
  })

  test('multiple instruments lifecycle', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(MARKET, ISIN)
    cache.activate(MARKET2, ISIN2)
    expect(cache.has(MARKET, ISIN)).toBe(true)
    expect(cache.has(MARKET2, ISIN2)).toBe(true)
    expect(cache.isEmpty()).toBe(false)

    cache.addQuote(MARKET, ISIN, 100, 101, 10)
    cache.addTrade(MARKET2, ISIN2, 55, 20)

    const q1 = cache.get(MARKET, ISIN)!
    const q2 = cache.get(MARKET2, ISIN2)!

    expect(q1.mid).toBe(100.5)
    expect(q1.quoteProviderTimeUnixMs).toBe(10)
    expect(q2.latestPrice).toBe(55)
    expect(q2.tradeProviderTimeUnixMs).toBe(20)

    cache.deactivate(MARKET, ISIN)
    expect(cache.has(MARKET, ISIN)).toBe(false)
    expect(cache.isEmpty()).toBe(false)

    cache.deactivate(MARKET2, ISIN2)
    expect(cache.isEmpty()).toBe(true)
  })

  test('same ISIN in different markets are stored separately', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(MARKET, ISIN)
    cache.activate(MARKET2, ISIN) // Same ISIN, different market

    cache.addQuote(MARKET, ISIN, 100, 101, 10)
    cache.addTrade(MARKET2, ISIN, 200, 20)

    const q1 = cache.get(MARKET, ISIN)!
    const q2 = cache.get(MARKET2, ISIN)!

    expect(q1.mid).toBe(100.5)
    expect(q1.quoteProviderTimeUnixMs).toBe(10)
    expect(q1.latestPrice).toBeUndefined() // No trade data for this market

    expect(q2.latestPrice).toBe(200)
    expect(q2.tradeProviderTimeUnixMs).toBe(20)
    expect(q2.mid).toBeUndefined() // No quote data for this market

    expect(cache.isEmpty()).toBe(false)
    cache.deactivate(MARKET, ISIN)
    expect(cache.has(MARKET, ISIN)).toBe(false)
    expect(cache.has(MARKET2, ISIN)).toBe(true) // Other market still active
    expect(cache.isEmpty()).toBe(false)

    cache.deactivate(MARKET2, ISIN)
    expect(cache.isEmpty()).toBe(true)
  })
})
