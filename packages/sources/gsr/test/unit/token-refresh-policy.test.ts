import {
  LIVENESS_GRACE_MS,
  livenessProbeDelayMs,
  MAX_TIMEOUT_MS,
  refreshDelayMs,
  renewalHeld,
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

describe('livenessProbeDelayMs', () => {
  it('probes a grace period after the previous expiry', () => {
    expect(livenessProbeDelayMs(NOW + 60_000, NOW)).toEqual(60_000 + LIVENESS_GRACE_MS)
  })

  it('probes immediately when the expiry has already passed', () => {
    // The renewal call itself can straddle the boundary on a slow response.
    expect(livenessProbeDelayMs(NOW - LIVENESS_GRACE_MS - 5_000, NOW)).toEqual(0)
  })

  it('never returns a negative delay', () => {
    expect(livenessProbeDelayMs(NOW - ONE_HOUR_MS, NOW)).toBeGreaterThanOrEqual(0)
  })
})

describe('renewalHeld', () => {
  it('treats recent traffic as proof the session survived', () => {
    expect(renewalHeld(NOW - 1_000, NOW)).toBe(true)
  })

  it('treats silence past the grace period as a failed renewal', () => {
    // HTTP 200 on the renewal does not mean GSR extended the session behind the
    // socket; only continued traffic does.
    expect(renewalHeld(NOW - LIVENESS_GRACE_MS - 1, NOW)).toBe(false)
  })

  it('is inclusive at the grace boundary', () => {
    expect(renewalHeld(NOW - LIVENESS_GRACE_MS, NOW)).toBe(true)
  })

  it('reconnects well before cached prices go stale', () => {
    // CACHE_MAX_AGE is 90s from the last message. Detecting at the grace
    // boundary has to leave room for a reconnect inside that window, otherwise
    // requests start 504ing again.
    expect(LIVENESS_GRACE_MS).toBeLessThan(90_000)
  })
})
