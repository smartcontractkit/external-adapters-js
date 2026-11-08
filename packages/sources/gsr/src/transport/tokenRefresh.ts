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
 * How soon after opening a session GSR closes it when it will not serve the
 * connection. The production rejection arrives about 1.4s after the handshake,
 * so this leaves room for slower rejections while staying close to the moment
 * the session was opened.
 */
export const EARLY_CLOSE_WINDOW_MS = 10_000

/**
 * Whether a closed session should invalidate the cached access token.
 *
 * GSR carries the token in the WebSocket handshake and closes a session it
 * will not serve rather than sending an error frame, so the close itself is
 * the only rejection signal. A ticker proves the token was accepted; without
 * one, a session that dies inside the early-close window or ends with GSR's
 * "Bye" reason was not accepted, and reusing the token would repeat the
 * rejection until it reaches its refresh margin.
 */
export const shouldDiscardTokenAfterClose = (
  reason: string | undefined,
  lifetimeMs: number,
  receivedTicker: boolean,
): boolean =>
  !receivedTicker &&
  (lifetimeMs < EARLY_CLOSE_WINDOW_MS || (reason ?? '').trim().toLowerCase() === 'bye')
