import {
  MAX_TIMEOUT_MS,
  REAUTH_MIN_INTERVAL_MS,
  refreshDelayMs,
  shouldDiscardTokenAfterClose,
  TOKEN_REFRESH_MARGIN_MS,
} from '../../src/transport/tokenRefresh'

const NOW = new Date('2026-08-06T12:00:00.000Z').getTime()
const ONE_HOUR_MS = 60 * 60 * 1000

describe('refreshDelayMs', () => {
  it('schedules the refresh a margin ahead of expiry', () => {
    const token = { token: 't', expiresAtMs: NOW + ONE_HOUR_MS }

    // GSR issues hour-long tokens, so the refresh lands at the 55 minute mark.
    expect(refreshDelayMs(token, NOW)).toEqual(ONE_HOUR_MS - TOKEN_REFRESH_MARGIN_MS)
  })

  it('returns null when the token is already inside the margin', () => {
    const token = { token: 't', expiresAtMs: NOW + TOKEN_REFRESH_MARGIN_MS - 1 }

    // Nothing useful to schedule; the connection path will mint a fresh token.
    expect(refreshDelayMs(token, NOW)).toBeNull()
  })

  it('returns null for an already expired token', () => {
    expect(refreshDelayMs({ token: 't', expiresAtMs: NOW - 1 }, NOW)).toBeNull()
  })

  it('clamps an implausibly distant expiry instead of overflowing setTimeout', () => {
    // Delays above 2^31-1 are silently coerced to 1ms by setTimeout, which would
    // fire the refresh immediately on every open and spin into a reconnect loop.
    const token = { token: 't', expiresAtMs: NOW + 100 * 365 * 24 * ONE_HOUR_MS }

    expect(refreshDelayMs(token, NOW)).toEqual(MAX_TIMEOUT_MS)
  })
})

describe('shouldDiscardTokenAfterClose', () => {
  it('discards the token the first time a session closes without a ticker', () => {
    // This is the post-incident case: a token minted before the outage is
    // refused, and recovery should take one reconnect.
    expect(shouldDiscardTokenAfterClose(false, NOW, undefined)).toBe(true)
  })

  it('keeps the token once the session has delivered a ticker', () => {
    // A ticker proves the token was accepted; a later close is not a rejection.
    expect(shouldDiscardTokenAfterClose(true, NOW, undefined)).toBe(false)
    expect(shouldDiscardTokenAfterClose(true, NOW, NOW - ONE_HOUR_MS)).toBe(false)
  })

  it('spaces forced re-authentications so a refusing provider is not flooded', () => {
    // A provider that refuses fresh tokens too would otherwise get a token
    // request on every reconnect, about once a second.
    expect(shouldDiscardTokenAfterClose(false, NOW, NOW - 1_000)).toBe(false)
    expect(shouldDiscardTokenAfterClose(false, NOW, NOW - REAUTH_MIN_INTERVAL_MS + 1)).toBe(false)
  })

  it('allows another forced re-authentication once the interval has passed', () => {
    expect(shouldDiscardTokenAfterClose(false, NOW, NOW - REAUTH_MIN_INTERVAL_MS)).toBe(true)
    expect(shouldDiscardTokenAfterClose(false, NOW, NOW - ONE_HOUR_MS)).toBe(true)
  })
})
