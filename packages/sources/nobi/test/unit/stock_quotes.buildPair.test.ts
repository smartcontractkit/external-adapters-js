jest.mock('@chainlink/external-adapter-framework/util/logger', () => ({
  makeLogger: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
    trace: jest.fn(),
  })),
}))

import { buildPair, invalidPairs } from '../../src/transport/stock_quotes'

describe('buildPair', () => {
  afterEach(() => {
    invalidPairs.clear()
  })

  it('joins base and quote with a slash', () => {
    expect(buildPair({ base: 'Equity:US:AAPL', quote: 'USD' })).toBe('Equity:US:AAPL/USD')
  })

  it('uppercases the quote', () => {
    expect(buildPair({ base: 'ETF:US:SPY', quote: 'usd' })).toBe('ETF:US:SPY/USD')
  })

  it('uppercases the market and ticker segments after the first colon of the base', () => {
    expect(buildPair({ base: 'Index:kr:kospi200', quote: 'USD' })).toBe('Index:KR:KOSPI200/USD')
    expect(buildPair({ base: 'Equity:us:aapl', quote: 'USD' })).toBe('Equity:US:AAPL/USD')
  })

  it('preserves the asset class prefix before the first colon as-is', () => {
    expect(buildPair({ base: 'etf:us:spy', quote: 'USD' })).toBe('etf:US:SPY/USD')
    expect(buildPair({ base: 'Equity:US:AAPL', quote: 'USD' })).toBe('Equity:US:AAPL/USD')
  })

  it('leaves a base with no colon unchanged', () => {
    expect(buildPair({ base: 'aapl', quote: 'usd' })).toBe('aapl/USD')
  })

  it('builds the same key regardless of market, ticker and quote casing', () => {
    const key = buildPair({ base: 'Equity:US:AAPL', quote: 'USD' })
    expect(buildPair({ base: 'Equity:us:aapl', quote: 'usd' })).toBe(key)
    expect(buildPair({ base: 'Equity:Us:Aapl', quote: 'Usd' })).toBe(key)
  })

  it('ignores request params other than base and quote', () => {
    const withVolume = { base: 'Equity:US:AAPL', quote: 'USD', requireVolume: true }
    const withoutVolume = { base: 'Equity:US:AAPL', quote: 'USD', requireVolume: false }
    expect(buildPair(withVolume)).toBe(buildPair(withoutVolume))
  })

  it('round-trips the pair code from a server message', () => {
    const c = 'ETF:US:SPY/USD'
    const [base, quote] = c.split('/')
    expect(buildPair({ base, quote })).toBe(c)
  })

  it('produces keys that match invalidPairs lookups for differently cased requests', () => {
    invalidPairs.add(buildPair({ base: 'Equity:US:FAKE', quote: 'USD' }))
    expect(invalidPairs.has(buildPair({ base: 'Equity:us:fake', quote: 'usd' }))).toBe(true)
    expect(invalidPairs.has(buildPair({ base: 'Equity:US:AAPL', quote: 'USD' }))).toBe(false)
  })
})
