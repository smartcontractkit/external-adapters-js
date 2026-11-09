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

/**
 * Minimum time between token requests made for new connections. The framework
 * only backs off when opening a connection throws; a session that opens and is
 * then refused reconnects on the next background pass, about a second later.
 * Without this floor, a provider that keeps refusing sessions would get a token
 * request on every pass, from every adapter instance, while it is already
 * struggling.
 */
export const MIN_TOKEN_REQUEST_INTERVAL_MS = 30_000

/**
 * Whether a new connection may reuse the cached token instead of requesting a
 * fresh one.
 *
 * GSR carries the token in the WebSocket handshake and refuses one only by
 * closing the session (code 1000, reason "Bye") or by going silent, so a token
 * carried over from an earlier connection may be one GSR has already refused.
 * Reusing it would repeat the rejection until the token reached its refresh
 * margin. Each connection therefore gets a fresh token, except when the cached
 * one was requested within MIN_TOKEN_REQUEST_INTERVAL_MS; a run of refused
 * sessions then costs one token request per interval, not one per reconnect.
 */
export const canReuseToken = (
  token: TokenWithExpiry,
  requestedAtMs: number,
  nowMs: number,
): boolean =>
  nowMs - requestedAtMs < MIN_TOKEN_REQUEST_INTERVAL_MS && refreshDelayMs(token, nowMs) !== null
