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

import type { Transport } from '@chainlink/external-adapter-framework/transports'
import { FillFirstTransportRoutes } from '../../src/endpoint/common'
import type { BaseEndpointTypes } from '../../src/endpoint/price'

// Mirrors the hardcoded provider cap in src/endpoint/common.ts
const MAX_TRANSPORTS = 10
const EXPECTED_TRANSPORT_NAMES = [
  'wsa',
  'wsb',
  'wsc',
  'wsd',
  'wse',
  'wsf',
  'wsg',
  'wsh',
  'wsi',
  'wsj',
]

// The class only hands transports to TransportRoutes.register, which stores them as-is,
// so an empty object is enough to stand in for a real WebSocketTransport.
const makeStubTransport = () => ({} as Transport<BaseEndpointTypes>)

const makeRoutes = () => new FillFirstTransportRoutes<BaseEndpointTypes>(makeStubTransport)

describe('FillFirstTransportRoutes', () => {
  describe('constructor', () => {
    it('registers one transport per slot, named wsa through wsj', () => {
      const routes = makeRoutes()
      expect(routes.getTransportRoutes().routeNames()).toEqual(EXPECTED_TRANSPORT_NAMES)
    })

    it('calls the factory once per transport and gives each route its own instance', () => {
      const factory = jest.fn(makeStubTransport)
      const routes = new FillFirstTransportRoutes<BaseEndpointTypes>(factory)

      expect(factory).toHaveBeenCalledTimes(MAX_TRANSPORTS)
      const instances = routes
        .getTransportRoutes()
        .routeNames()
        .map((name) => routes.getTransportRoutes().get(name))
      expect(new Set(instances).size).toBe(MAX_TRANSPORTS)
    })

    it('uses the first transport as the default', () => {
      const routes = makeRoutes()
      expect(routes.defaultTransportName()).toBe('wsa')
      expect(routes.getTransportRoutes().get('wsa')).toBeDefined()
    })
  })

  describe('routeRequest', () => {
    let routes: FillFirstTransportRoutes<BaseEndpointTypes>

    beforeEach(() => {
      routes = makeRoutes()
    })

    it('routes the same pair to the same transport on repeated calls', () => {
      const first = routes.routeRequest('ETH', 'USD', 10)
      const second = routes.routeRequest('ETH', 'USD', 10)
      expect(first).toBe(second)
    })

    it('routes new pairs to wsa by default', () => {
      expect(routes.routeRequest('ETH', 'USD', 10)).toBe('wsa')
    })

    it('routes different pairs to the same transport when capacity allows', () => {
      expect(routes.routeRequest('ETH', 'USD', 10)).toBe('wsa')
      expect(routes.routeRequest('BTC', 'USD', 10)).toBe('wsa')
    })

    it('spills over to wsb when wsa reaches capacity', () => {
      routes.routeRequest('ETH', 'USD', 1)
      expect(routes.routeRequest('BTC', 'USD', 1)).toBe('wsb')
    })

    it('keeps spilling across transports as each fills up', () => {
      routes.routeRequest('ETH', 'USD', 1) // wsa
      routes.routeRequest('BTC', 'USD', 1) // wsb
      expect(routes.routeRequest('SOL', 'USD', 1)).toBe('wsc')
    })

    it('fills every registered transport before running out of capacity', () => {
      const assigned = EXPECTED_TRANSPORT_NAMES.map((_, i) =>
        routes.routeRequest(`ASSET${i}`, 'USD', 1),
      )
      expect(assigned).toEqual(EXPECTED_TRANSPORT_NAMES)
    })

    it('throws 429 when all transports are at capacity', () => {
      for (let i = 0; i < MAX_TRANSPORTS; i++) {
        routes.routeRequest(`ASSET${i}`, 'USD', 1)
      }
      expect(() => routes.routeRequest('OVERFLOW', 'USD', 1)).toThrow(
        expect.objectContaining({ statusCode: 429 }),
      )
    })

    it('does not count the same pair twice against capacity', () => {
      for (let i = 0; i < MAX_TRANSPORTS; i++) {
        routes.routeRequest(`ASSET${i}`, 'USD', 1)
      }
      expect(() => routes.routeRequest('ASSET0', 'USD', 1)).not.toThrow()
      expect(routes.routeRequest('ASSET0', 'USD', 1)).toBe('wsa')
    })

    it('keeps routing state isolated between instances', () => {
      const other = makeRoutes()
      routes.routeRequest('ETH', 'USD', 1) // fills wsa on this instance only
      expect(routes.routeRequest('BTC', 'USD', 1)).toBe('wsb')
      expect(other.routeRequest('BTC', 'USD', 1)).toBe('wsa')
    })
  })
})
