import { TokenWithExpiry } from './authutils'

/** How far ahead of expiry to act, so the provider is still sending data. */
export const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000

/**
 * setTimeout coerces any delay above this to 1ms. Left unclamped, an
 * implausibly distant expiry would fire the refresh immediately on every open,
 * turning this mechanism into a reconnect loop.
 */
export const MAX_TIMEOUT_MS = 2 ** 31 - 1

/**
 * Delay until the next refresh attempt, or null when the token is already
 * inside the margin and there is nothing useful to schedule.
 */
export const refreshDelayMs = (token: TokenWithExpiry, nowMs: number): number | null => {
  const delay = token.expiresAtMs - nowMs - TOKEN_REFRESH_MARGIN_MS
  return delay > 0 ? Math.min(delay, MAX_TIMEOUT_MS) : null
}
