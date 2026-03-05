import * as configModule from '../../src/config'
import { wsSelectUrl } from '../../src/transport/utils'

jest.mock('../../src/config', () => ({
  config: {
    settings: {
      WS_URL_PRIMARY_ATTEMPTS: 1,
      WS_URL_SECONDARY_ATTEMPTS: 1,
    },
  },
}))

jest.mock('@chainlink/external-adapter-framework/util', () => ({
  ...jest.requireActual('@chainlink/external-adapter-framework/util'),
  makeLogger: jest.fn(() => ({
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
  })),
}))

/**
 * Tests for the Tiingo-specific wsSelectUrl function, which selects between
 * primary and secondary WebSocket URLs based on a connection attempt counter.
 *
 * The counter (streamHandlerInvocationsWithNoConnection) is incremented by the
 * framework on unresponsive connection detection and on abnormal WS closures
 * (code != 1000). wsSelectUrl uses the counter to cycle between URLs according
 * to the configured WS_URL_PRIMARY_ATTEMPTS / WS_URL_SECONDARY_ATTEMPTS ratio.
 */
describe('wsSelectUrl -- 1:1 ratio', () => {
  const primary = 'wss://api.tiingo.com'
  const secondary = 'wss://api.redundantstack.com'
  const suffix = 'iex'
  const params = (n: number) => ({ streamHandlerInvocationsWithNoConnection: n })

  it('routes to primary at the start of each cycle', () => {
    expect(wsSelectUrl(primary, secondary, suffix, params(0))).toBe(`${primary}/${suffix}`)
    expect(wsSelectUrl(primary, secondary, suffix, params(1))).toBe(`${primary}/${suffix}`)
  })

  it('routes to secondary on the second position of each cycle', () => {
    expect(wsSelectUrl(primary, secondary, suffix, params(2))).toBe(`${secondary}/${suffix}`)
  })

  it('cycles back to primary after secondary', () => {
    expect(wsSelectUrl(primary, secondary, suffix, params(3))).toBe(`${primary}/${suffix}`)
  })

  it('continues alternating in a repeating pattern', () => {
    expect(wsSelectUrl(primary, secondary, suffix, params(4))).toBe(`${secondary}/${suffix}`)
    expect(wsSelectUrl(primary, secondary, suffix, params(5))).toBe(`${primary}/${suffix}`)
    expect(wsSelectUrl(primary, secondary, suffix, params(6))).toBe(`${secondary}/${suffix}`)
  })
})

describe('wsSelectUrl -- 5:1 ratio (production default)', () => {
  const primary = 'wss://api.tiingo.com'
  const secondary = 'wss://api.redundantstack.com'
  const suffix = 'iex'
  const params = (n: number) => ({ streamHandlerInvocationsWithNoConnection: n })

  beforeEach(() => {
    ;(configModule.config.settings as Record<string, unknown>).WS_URL_PRIMARY_ATTEMPTS = 5
    ;(configModule.config.settings as Record<string, unknown>).WS_URL_SECONDARY_ATTEMPTS = 1
  })

  afterEach(() => {
    ;(configModule.config.settings as Record<string, unknown>).WS_URL_PRIMARY_ATTEMPTS = 1
    ;(configModule.config.settings as Record<string, unknown>).WS_URL_SECONDARY_ATTEMPTS = 1
  })

  it('routes to primary for the first 5 positions in each cycle', () => {
    expect(wsSelectUrl(primary, secondary, suffix, params(1))).toBe(`${primary}/${suffix}`)
    expect(wsSelectUrl(primary, secondary, suffix, params(2))).toBe(`${primary}/${suffix}`)
    expect(wsSelectUrl(primary, secondary, suffix, params(3))).toBe(`${primary}/${suffix}`)
    expect(wsSelectUrl(primary, secondary, suffix, params(4))).toBe(`${primary}/${suffix}`)
    expect(wsSelectUrl(primary, secondary, suffix, params(5))).toBe(`${primary}/${suffix}`)
  })

  it('routes to secondary on the 6th position and back to primary on the 7th', () => {
    expect(wsSelectUrl(primary, secondary, suffix, params(6))).toBe(`${secondary}/${suffix}`)
    expect(wsSelectUrl(primary, secondary, suffix, params(7))).toBe(`${primary}/${suffix}`)
  })

  it('repeats the 5:1 pattern across multiple cycles', () => {
    // Cycle 2: positions 7-12 (5 primary, 1 secondary)
    expect(wsSelectUrl(primary, secondary, suffix, params(7))).toBe(`${primary}/${suffix}`)
    expect(wsSelectUrl(primary, secondary, suffix, params(11))).toBe(`${primary}/${suffix}`)
    expect(wsSelectUrl(primary, secondary, suffix, params(12))).toBe(`${secondary}/${suffix}`)
    expect(wsSelectUrl(primary, secondary, suffix, params(13))).toBe(`${primary}/${suffix}`)
  })
})
