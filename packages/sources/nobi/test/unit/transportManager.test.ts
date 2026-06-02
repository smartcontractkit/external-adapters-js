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

import { NobiTransportManager as TransportManager } from '../../src/endpoint/transportManager'

describe('TransportManager', () => {
  describe('constructor', () => {
    it('creates the configured number of transports', () => {
      const manager = new TransportManager(3, 10)
      expect(manager.transportTrackers).toHaveLength(3)
    })

    it('assigns unique names to each transport', () => {
      const manager = new TransportManager(3, 10)
      const names = manager.transportTrackers.map((t) => t.name)
      expect(names).toEqual(['wsa', 'wsb', 'wsc'])
    })

    it('rolls over to two-letter suffixes beyond 26 transports', () => {
      const manager = new TransportManager(28, 10)
      const names = manager.transportTrackers.map((t) => t.name)
      expect(names[25]).toBe('wsz')
      expect(names[26]).toBe('wsaa')
      expect(names[27]).toBe('wsab')
    })
  })

  describe('routeRequest', () => {
    it('routes the same pair to the same transport on repeated calls', () => {
      const manager = new TransportManager(3, 10)
      const first = manager.routeRequest('ETH', 'USD')
      const second = manager.routeRequest('ETH', 'USD')
      expect(first).toBe(second)
    })

    it('routes different pairs to the same transport when capacity allows', () => {
      const manager = new TransportManager(1, 10)
      const eth = manager.routeRequest('ETH', 'USD')
      const btc = manager.routeRequest('BTC', 'USD')
      expect(eth).toBe(btc)
    })

    it('spreads pairs across transports when one reaches capacity', () => {
      const manager = new TransportManager(2, 1)
      const first = manager.routeRequest('ETH', 'USD')
      const second = manager.routeRequest('BTC', 'USD')
      expect(first).not.toBe(second)
    })

    it('throws when all transports are at capacity', () => {
      const manager = new TransportManager(2, 1)
      manager.routeRequest('ETH', 'USD')
      manager.routeRequest('BTC', 'USD')
      expect(() => manager.routeRequest('LINK', 'USD')).toThrow(
        'Unable to route request: all transports are at capacity',
      )
    })

    it('does not count the same pair twice against capacity', () => {
      const manager = new TransportManager(1, 1)
      manager.routeRequest('ETH', 'USD')
      // same pair again — should not throw even though capacity is 1
      expect(() => manager.routeRequest('ETH', 'USD')).not.toThrow()
    })

    it('returns the first transport name for new pairs by default', () => {
      const manager = new TransportManager(3, 10)
      const name = manager.routeRequest('ETH', 'USD')
      expect(name).toBe('wsa')
    })
  })

  describe('setupTransportRoutes', () => {
    it('registers all transports', () => {
      const manager = new TransportManager(3, 10)
      const routes = manager.setupTransportRoutes()
      // Each transport should be registered — verify by routing to each name without error
      for (const tracker of manager.transportTrackers) {
        expect(() => routes.get(tracker.name)).not.toThrow()
      }
    })
  })
})
