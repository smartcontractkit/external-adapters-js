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
 * These tests document and validate the URL cycling behavior that fixes
 * the production issue where the IEX transport gets stuck on a broken
 * secondary URL (api.redundantstack.com) due to repeated 1005 closures.
 *
 * The fix (in the framework): abnormal WS closures (code !== 1000)
 * now increment streamHandlerInvocationsWithNoConnection, which allows
 * wsSelectUrl to cycle back to the primary URL.
 *
 * Without the fix, the counter stays frozen after reaching the secondary,
 * and the transport reconnects to the broken secondary every ~1.5s forever.
 */
describe('wsSelectUrl failover cycling -- 1:1 ratio', () => {
  // 1:1 used here to keep counter values small and assertions easy to follow.
  // Production default is 5:1 (see describe block below).
  const primary = 'wss://api.tiingo.com'
  const secondary = 'wss://api.redundantstack.com'
  const suffix = 'iex'
  const params = (n: number) => ({ streamHandlerInvocationsWithNoConnection: n })

  it('counter=0 and counter=1 both route to primary', () => {
    expect(wsSelectUrl(primary, secondary, suffix, params(0))).toBe(`${primary}/${suffix}`)
    expect(wsSelectUrl(primary, secondary, suffix, params(1))).toBe(`${primary}/${suffix}`)
  })

  it('counter=2 routes to secondary (the problematic URL)', () => {
    expect(wsSelectUrl(primary, secondary, suffix, params(2))).toBe(`${secondary}/${suffix}`)
  })

  it('counter=3 escapes secondary and returns to primary', () => {
    // This is the key assertion: after the framework increments the counter
    // on a 1005 abnormal close from the secondary, the counter goes from 2->3,
    // and wsSelectUrl routes back to primary.
    expect(wsSelectUrl(primary, secondary, suffix, params(3))).toBe(`${primary}/${suffix}`)
  })

  it('continues to alternate after escaping', () => {
    expect(wsSelectUrl(primary, secondary, suffix, params(4))).toBe(`${secondary}/${suffix}`)
    expect(wsSelectUrl(primary, secondary, suffix, params(5))).toBe(`${primary}/${suffix}`)
    expect(wsSelectUrl(primary, secondary, suffix, params(6))).toBe(`${secondary}/${suffix}`)
  })

  it('simulates the full production failure scenario', () => {
    // Simulate: primary goes unresponsive, counter increments via unresponsive detection,
    // then secondary closes with 1005, counter increments via abnormal close handler.
    const urls: string[] = []

    urls.push(wsSelectUrl(primary, secondary, suffix, params(0)))
    expect(urls[0]).toBe(`${primary}/${suffix}`)

    // counter=1: first unresponsive detection, still primary
    urls.push(wsSelectUrl(primary, secondary, suffix, params(1)))
    expect(urls[1]).toBe(`${primary}/${suffix}`)

    // counter=2: second detection -> switches to secondary
    urls.push(wsSelectUrl(primary, secondary, suffix, params(2)))
    expect(urls[2]).toBe(`${secondary}/${suffix}`)

    // counter=3: secondary closed with 1005, framework incremented counter -> back to primary
    urls.push(wsSelectUrl(primary, secondary, suffix, params(3)))
    expect(urls[3]).toBe(`${primary}/${suffix}`)

    expect(urls).toEqual([
      `${primary}/${suffix}`,
      `${primary}/${suffix}`,
      `${secondary}/${suffix}`,
      `${primary}/${suffix}`,
    ])
  })

  it('demonstrates the bug when counter is stuck (pre-fix behavior)', () => {
    // WITHOUT the fix: after reaching secondary (counter=2), abnormal closes
    // do NOT increment the counter. So wsSelectUrl is called with counter=2
    // repeatedly, always returning secondary.
    const stuckCounter = 2
    for (let i = 0; i < 10; i++) {
      expect(wsSelectUrl(primary, secondary, suffix, params(stuckCounter))).toBe(
        `${secondary}/${suffix}`,
      )
    }
    // The transport is stuck on the broken secondary URL forever.
    // Only the framework fix (incrementing counter on abnormal close) breaks this loop.
  })
})

describe('wsSelectUrl failover cycling -- 5:1 ratio (production default)', () => {
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

  it('routes to primary for first 5 attempts then secondary on 6th', () => {
    expect(wsSelectUrl(primary, secondary, suffix, params(1))).toBe(`${primary}/${suffix}`)
    expect(wsSelectUrl(primary, secondary, suffix, params(2))).toBe(`${primary}/${suffix}`)
    expect(wsSelectUrl(primary, secondary, suffix, params(3))).toBe(`${primary}/${suffix}`)
    expect(wsSelectUrl(primary, secondary, suffix, params(4))).toBe(`${primary}/${suffix}`)
    expect(wsSelectUrl(primary, secondary, suffix, params(5))).toBe(`${primary}/${suffix}`)
    expect(wsSelectUrl(primary, secondary, suffix, params(6))).toBe(`${secondary}/${suffix}`)
  })

  it('cycles back to primary after secondary and repeats the 5:1 pattern', () => {
    expect(wsSelectUrl(primary, secondary, suffix, params(7))).toBe(`${primary}/${suffix}`)
    expect(wsSelectUrl(primary, secondary, suffix, params(11))).toBe(`${primary}/${suffix}`)
    expect(wsSelectUrl(primary, secondary, suffix, params(12))).toBe(`${secondary}/${suffix}`)
    expect(wsSelectUrl(primary, secondary, suffix, params(13))).toBe(`${primary}/${suffix}`)
  })

  it('escapes a broken secondary after a single 1005 close (counter increments from 6 to 7)', () => {
    // At counter=6 the transport connects to secondary; it closes with 1005,
    // framework increments counter to 7, which maps back to primary (cycle pos 0).
    expect(wsSelectUrl(primary, secondary, suffix, params(6))).toBe(`${secondary}/${suffix}`)
    expect(wsSelectUrl(primary, secondary, suffix, params(7))).toBe(`${primary}/${suffix}`)
  })
})
