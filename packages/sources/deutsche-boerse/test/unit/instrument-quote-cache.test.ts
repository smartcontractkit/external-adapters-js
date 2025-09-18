import { InstrumentQuoteCache } from '../../src/transport/instrument-quote-cache'

describe('InstrumentQuoteCache', () => {
  const ISIN = 'IE00B53L3W79'

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
    const q = cache.get(ISIN)
    expect(q?.bid).toBe(100)
    expect(q?.ask).toBe(102)
    expect(q?.mid).toBe(101)
    expect(q?.quoteProviderTimeUnixMs).toBe(1234)
  })

  test('addTrade sets latestPrice and trade time', () => {
    const cache = new InstrumentQuoteCache()
    cache.activate(ISIN)

    cache.addTrade(ISIN, 99.5, 2222)
    const q = cache.get(ISIN)

    expect(q?.latestPrice).toBe(99.5)
    expect(q?.tradeProviderTimeUnixMs).toBe(2222)
  })
})
