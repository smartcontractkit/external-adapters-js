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
 * Minimum time between forced re-authentications. The framework only backs off
 * when opening a connection throws; a session that opens and is then refused
 * reconnects on the next background pass, about a second later. Without this
 * floor, a provider that keeps refusing fresh tokens would get a token request
 * on every pass, from every adapter instance, while it is already struggling.
 */
export const REAUTH_MIN_INTERVAL_MS = 30_000

/**
 * Whether a closed session should invalidate the cached access token.
 *
 * GSR carries the token in the WebSocket handshake and signals a refused token
 * only by closing the session (code 1000, reason "Bye", right after the
 * handshake) or by staying silent until the framework closes it as
 * unresponsive. A ticker proves the token was accepted. Without one, reusing
 * the token could repeat the rejection until it reaches its refresh margin.
 *
 * The first discard is always allowed, so recovery after a provider incident
 * takes seconds; later ones are spaced by REAUTH_MIN_INTERVAL_MS.
 */
export const shouldDiscardTokenAfterClose = (
  receivedTicker: boolean,
  nowMs: number,
  lastForcedReauthAtMs: number | undefined,
): boolean =>
  !receivedTicker &&
  (lastForcedReauthAtMs === undefined || nowMs - lastForcedReauthAtMs >= REAUTH_MIN_INTERVAL_MS)
