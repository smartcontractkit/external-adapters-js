import {
  canReuseToken,
  MAX_TIMEOUT_MS,
  MIN_TOKEN_REQUEST_INTERVAL_MS,
  refreshDelayMs,
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

describe('canReuseToken', () => {
  const token = { token: 't', expiresAtMs: NOW + ONE_HOUR_MS }

  it('requests a fresh token once the cached one is older than the interval', () => {
    // The post-incident case: a token requested before the outage may be one
    // GSR now refuses, so the next connection must not carry it over.
    expect(canReuseToken(token, NOW - MIN_TOKEN_REQUEST_INTERVAL_MS, NOW)).toBe(false)
    expect(canReuseToken(token, NOW - 20 * 60 * 1000, NOW)).toBe(false)
  })

  it('reuses a token requested within the interval so a refusing provider is not flooded', () => {
    // Refused sessions reconnect about once a second; without this each one
    // would send a token request.
    expect(canReuseToken(token, NOW - 1_000, NOW)).toBe(true)
    expect(canReuseToken(token, NOW - MIN_TOKEN_REQUEST_INTERVAL_MS + 1, NOW)).toBe(true)
  })

  it('does not reuse a token already inside its refresh margin', () => {
    const expiring = { token: 't', expiresAtMs: NOW + TOKEN_REFRESH_MARGIN_MS - 1 }

    expect(canReuseToken(expiring, NOW, NOW)).toBe(false)
  })
})
