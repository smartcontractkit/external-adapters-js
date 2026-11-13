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

import { requestMapping, routeRequest } from '../../src/endpoint/price'

beforeEach(() => {
  requestMapping.clear()
})

describe('routeRequest', () => {
  it('routes the same pair to the same transport on repeated calls', () => {
    const first = routeRequest('ETH', 'USD', 10, 10)
    const second = routeRequest('ETH', 'USD', 10, 10)
    expect(first).toBe(second)
  })

  it('routes new pairs to wsa by default', () => {
    expect(routeRequest('ETH', 'USD', 10, 10)).toBe('wsa')
  })

  it('routes different pairs to the same transport when capacity allows', () => {
    const eth = routeRequest('ETH', 'USD', 10, 10)
    const btc = routeRequest('BTC', 'USD', 10, 10)
    expect(eth).toBe('wsa')
    expect(btc).toBe('wsa')
  })

  it('spills over to wsb when wsa reaches capacity', () => {
    routeRequest('ETH', 'USD', 10, 1)
    const second = routeRequest('BTC', 'USD', 10, 1)
    expect(second).toBe('wsb')
  })

  it('keeps spilling across transports as each fills up', () => {
    routeRequest('ETH', 'USD', 10, 1) // wsa
    routeRequest('BTC', 'USD', 10, 1) // wsb
    expect(routeRequest('SOL', 'USD', 10, 1)).toBe('wsc')
  })

  it('throws 429 when all transports are at capacity', () => {
    routeRequest('ETH', 'USD', 1, 1)
    expect(() => routeRequest('BTC', 'USD', 1, 1)).toThrow(
      expect.objectContaining({ statusCode: 429 }),
    )
  })

  it('does not count the same pair twice against capacity', () => {
    routeRequest('ETH', 'USD', 1, 1)
    expect(() => routeRequest('ETH', 'USD', 1, 1)).not.toThrow()
  })
})
