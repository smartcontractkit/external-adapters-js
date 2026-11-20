// Throttles a repeated, sticky log line to at most one emission per `windowMs`
// per key. Conditions like a tradinghours fetch failure or an undetermined
// schedule persist across many gated requests; the failure backoff in
// transitionCache only suppresses the upstream fetch, not the caller's log, so
// without a throttle every gated price request re-logs the same line. One line
// per key per window keeps the condition visible (still alertable) without
// flooding logs or tripping alert thresholds during an outage.
export type LogThrottle = (key: string, log: () => void, nowMs?: number) => void

// Shared window for the session-schedule log throttles (matches the original
// "Market schedule undetermined" throttle).
export const LOG_THROTTLE_WINDOW_MS = 60_000

export const createLogThrottle = (windowMs: number): LogThrottle => {
  const lastLoggedAtMs = new Map<string, number>()
  return (key, log, nowMs = Date.now()) => {
    const last = lastLoggedAtMs.get(key)
    if (last === undefined || nowMs - last >= windowMs) {
      lastLoggedAtMs.set(key, nowMs)
      log()
    }
  }
}
