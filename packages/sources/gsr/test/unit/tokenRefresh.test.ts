import {
  EARLY_CLOSE_WINDOW_MS,
  MAX_TIMEOUT_MS,
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
  it('discards the token when a session closes without a ticker inside the early window', () => {
    // The production rejection arrives about 1.4s after the handshake, often
    // with an empty reason, so the window is the reliable signal.
    expect(shouldDiscardTokenAfterClose('', 1_400, false)).toBe(true)
    expect(shouldDiscardTokenAfterClose(undefined, 1_400, false)).toBe(true)
  })

  it('treats the early-close window as open-ended at its boundary', () => {
    expect(shouldDiscardTokenAfterClose('', EARLY_CLOSE_WINDOW_MS - 1, false)).toBe(true)
    expect(shouldDiscardTokenAfterClose('', EARLY_CLOSE_WINDOW_MS, false)).toBe(false)
  })

  it('discards the token when GSR says Bye even after the early window', () => {
    // The reason is provider-controlled, so ignore case and surrounding space.
    expect(shouldDiscardTokenAfterClose('Bye', 60_000, false)).toBe(true)
    expect(shouldDiscardTokenAfterClose(' BYE ', 60_000, false)).toBe(true)
  })

  it('keeps the token once the session has delivered a ticker', () => {
    // A ticker proves the token was accepted; a later close is not a rejection.
    expect(shouldDiscardTokenAfterClose('', 1_400, true)).toBe(false)
    expect(shouldDiscardTokenAfterClose('Bye', 60_000, true)).toBe(false)
  })

  it('keeps the token when a data-less session outlived the early window without Bye', () => {
    expect(shouldDiscardTokenAfterClose('', 60_000, false)).toBe(false)
  })
})
