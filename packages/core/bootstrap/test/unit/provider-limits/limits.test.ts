import * as limits from '../../../src/lib/provider-limits'

jest.mock('../../../src/lib/provider-limits/limits.json', () => ({
  amberdata: {
    http: {
      starter: {
        rateLimit1h: 10
      },
      premium: {
        rateLimit1h: 20
      },
      business: {
        rateLimit1h: 30
      },
    },
    ws: {
      starter: {
        connections: 10,
        subscriptions: 20
      }
    }
  }
}), { virtual: true })


describe('Provider Limits', () => {
  it('gets the correct rate limits', () => {
    const limit = limits.getRateLimit('amberdata', 'starter')
    expect(limit.minute).toBe(10/60)
    expect(limit.second).toBe(10/60/60 * 2)
  })

  it('default rate limit if no tier match', () => {
    const limit = limits.getRateLimit('amberdata', 'non-existent')
    expect(limit.minute).toBe(limits.DEFAULT_MINUTE_RATE_LIMIT)
  })

  it('default rate limit if no provider match', () => {
    const limit = limits.getRateLimit('non-existent', 'non-existent')
    expect(limit.minute).toBe(limits.DEFAULT_MINUTE_RATE_LIMIT)
  })

  it('gets the correct ws limits', () => {
    const limit = limits.getWSLimits('amberdata', 'starter')
    expect(limit.connections).toBe(10)
    expect(limit.subscriptions).toBe(20)
  })

  it('default WS limit if no tier match', () => {
    const limit = limits.getWSLimits('amberdata', 'non-existent')
    expect(limit.connections).toBe(limits.DEFAULT_WS_CONNECTIONS)
    expect(limit.subscriptions).toBe(limits.DEFAULT_WS_SUBSCRIPTIONS)
  })

  it('default WS limit if no provider match', () => {
    const limit = limits.getWSLimits('non-existent', 'non-existent')
    expect(limit.connections).toBe(limits.DEFAULT_WS_CONNECTIONS)
    expect(limit.subscriptions).toBe(limits.DEFAULT_WS_SUBSCRIPTIONS)
  })
})
