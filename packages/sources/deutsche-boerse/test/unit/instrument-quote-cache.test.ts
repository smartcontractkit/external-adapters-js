// packages/sources/deutsche-boerse/test/unit/instrument-quote-cache.test.ts
import { InstrumentQuoteCache } from '../../src/transport/instrument-quote-cache'

describe('InstrumentQuoteCache', () => {
  const ISIN = 'IE00B53L3W79'
  const ISIN2 = 'US0000000001'

  test('activate/deactivate/has/isEmpty/get', () => {
    const cache = new InstrumentQuoteCache()
    expect(cache.isEmpty()).toBe(true)
    cache.activate(ISIN)
    expect(cache.has(ISIN)).toBe(true)
    expect(cache.get(ISIN)).toEqual({})
    expect(cache.isEmpty()).toBe(false)
    cache.deactivate(ISIN)
    expect(cache.has(ISIN)).toBe(false)
    expect(cache.isEmpty()).toBe(true)
  })

  test('addQuote sets bid/ask/mid and quote time', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(ISIN)

    cache.addQuote(ISIN, 100, 102, 1234)
    const q = cache.get(ISIN)!
    expect(q.bid).toBe(100)
    expect(q.ask).toBe(102)
    expect(q.mid).toBe(101)
    expect(q.quoteProviderTimeUnixMs).toBe(1234)
  })

  test('addBid then addAsk recomputes mid and updates quote time', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(ISIN)

    cache.addBid(ISIN, 100, 1111) // only bid
    let q = cache.get(ISIN)!
    expect(q.bid).toBe(100)
    expect(q.ask).toBeUndefined()
    expect(q.mid).toBeUndefined()
    expect(q.quoteProviderTimeUnixMs).toBe(1111)

    cache.addAsk(ISIN, 102, 2222) // now ask arrives
    q = cache.get(ISIN)!
    expect(q.ask).toBe(102)
    expect(q.mid).toBe(101)
    expect(q.quoteProviderTimeUnixMs).toBe(2222)
  })

  test('addAsk then addBid recomputes mid and updates quote time', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(ISIN)

    cache.addAsk(ISIN, 50, 3333)
    let q = cache.get(ISIN)!
    expect(q.ask).toBe(50)
    expect(q.mid).toBeUndefined()

    cache.addBid(ISIN, 48, 4444)
    q = cache.get(ISIN)!
    expect(q.bid).toBe(48)
    expect(q.mid).toBe(49)
    expect(q.quoteProviderTimeUnixMs).toBe(4444)
  })

  test('addTrade sets latestPrice and trade time', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(ISIN)

    cache.addTrade(ISIN, 99.5, 2222)
    const q = cache.get(ISIN)!
    expect(q.latestPrice).toBe(99.5)
    expect(q.tradeProviderTimeUnixMs).toBe(2222)
  })

  test('addQuote/addBid/addAsk/addTrade without activate throws', () => {
    const cache = new InstrumentQuoteCache()
    expect(() => cache.addQuote(ISIN, 100, 102, 1234)).toThrow(/inactive isin/i)
    expect(() => cache.addBid(ISIN, 100, 1)).toThrow(/inactive isin/i)
    expect(() => cache.addAsk(ISIN, 100, 1)).toThrow(/inactive isin/i)
    expect(() => cache.addTrade(ISIN, 99.5, 2222)).toThrow(/inactive isin/i)
  })

  test('deactivate then attempt to add -> throws', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(ISIN)
    cache.deactivate(ISIN)
    expect(() => cache.addQuote(ISIN, 1, 2, 3)).toThrow(/inactive isin/i)
    expect(() => cache.addTrade(ISIN, 1, 3)).toThrow(/inactive isin/i)
  })

  test('mid is computed correctly for equal sides and edge values', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(ISIN)
    cache.addQuote(ISIN, 0, 0, 123)
    const q = cache.get(ISIN)!
    expect(q.bid).toBe(0)
    expect(q.ask).toBe(0)
    expect(q.mid).toBe(0)
    expect(q.quoteProviderTimeUnixMs).toBe(123)
  })

  test('multiple instruments lifecycle', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(ISIN)
    cache.activate(ISIN2)
    expect(cache.has(ISIN)).toBe(true)
    expect(cache.has(ISIN2)).toBe(true)
    expect(cache.isEmpty()).toBe(false)

    cache.addQuote(ISIN, 100, 101, 10)
    cache.addTrade(ISIN2, 55, 20)

    const q1 = cache.get(ISIN)!
    const q2 = cache.get(ISIN2)!

    expect(q1.mid).toBe(100.5)
    expect(q1.quoteProviderTimeUnixMs).toBe(10)
    expect(q2.latestPrice).toBe(55)
    expect(q2.tradeProviderTimeUnixMs).toBe(20)

    cache.deactivate(ISIN)
    expect(cache.has(ISIN)).toBe(false)
    expect(cache.isEmpty()).toBe(false)

    cache.deactivate(ISIN2)
    expect(cache.isEmpty()).toBe(true)
  })
})
