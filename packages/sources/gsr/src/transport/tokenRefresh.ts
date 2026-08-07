import { TokenWithExpiry } from './authutils'

/** How far ahead of expiry to act, so the provider is still sending data. */
export const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000

/**
 * How long past the old expiry to let the connection prove itself before
 * concluding an in-place renewal did not take. Must leave room to reconnect
 * before cached prices go stale at CACHE_MAX_AGE (90s from the last message).
 */
export const LIVENESS_GRACE_MS = 20 * 1000

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

/**
 * Delay until we check whether a renewal actually kept the session alive.
 * Clamped at zero because the expiry may already have passed by the time the
 * renewal call returns.
 */
export const livenessProbeDelayMs = (previousExpiryMs: number, nowMs: number): number =>
  Math.min(Math.max(0, previousExpiryMs + LIVENESS_GRACE_MS - nowMs), MAX_TIMEOUT_MS)

/**
 * Whether the provider is still sending. A renewal returning HTTP 200 says the
 * token was renewed, not that GSR extended the session behind the socket, which
 * still carries the original token in its handshake headers. Continued traffic
 * is the only real evidence.
 */
export const renewalHeld = (lastMessageAtMs: number, nowMs: number): boolean =>
  nowMs - lastMessageAtMs <= LIVENESS_GRACE_MS
