import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('SessionTransitionCache')

// Stale-while-revalidate cache for tradinghours market-session schedules, shared by
// both session-start gates (24/5 via getSessionSchedule, 24/7 via the issuer-price-247
// gate) so neither pays a tradinghours HTTP hop per price request. The schedule's
// contents change at day granularity, so a short TTL (default 60s, configured via
// TRADINGHOURS_SESSION_CACHE_TTL_MS) trades no meaningful freshness for the hop.
//
// Callers always get a value when one exists — a stale entry is served while a
// deduped background refresh runs — and the returned entry carries the staleness
// signal (refreshedAtMs, ttlMs, stale) so the caller can make its own decision
// about acting on an old schedule. Only the INITIAL fetch blocks: with no cached
// value there is nothing to serve, so the caller awaits the fetch (and its failure).
//
// Stale serving is bounded by maxAgeMs: a cached schedule only reaches ~1 day past
// its fetch time, so serving it indefinitely during a sustained tradinghours outage
// would silently weaken session-start gating (the gate would compare against session
// starts that are far too old) while reporting source TRADINGHOURS. Once an entry
// is older than maxAgeMs it is discarded and the fetch blocks again, so a fetch
// failure surfaces to the caller exactly like an initial-fetch failure — the caller
// logs its 'TradingHoursEA request failed' line and falls through to the hard-coded
// fallback schedule (source FALLBACK), keeping the outage fail-closed and loud.

export type CachedValue<T> = {
  value: T
  // When the last successful refresh completed (epoch ms).
  refreshedAtMs: number
  ttlMs: number
  // true when now - refreshedAtMs >= ttlMs: the value is past its TTL (a background
  // refresh has been kicked off, unless one was already in flight).
  stale: boolean
}

type Entry<T> = {
  value: T
  refreshedAtMs: number
}

// Keyed by the full request identity (see getSessionTransitionsCached).
// Unbounded by construction but bounded in practice: url/tz/market/type are all
// deployment- or code-level values (one tradinghours URL per deployment; tz and
// market come from FALLBACK_SESSION_SCHEDULE entries, type from TYPE_STATUS_VIEWS)
// — never requester-controlled input — so the map holds a handful of entries per
// process and only grows when a market is added to the hard-coded schedule.
const entries = new Map<string, Entry<unknown>>()
const inFlightRefreshes = new Map<string, Promise<void>>()

export const getCachedValue = async <T>(
  key: string,
  ttlMs: number,
  maxAgeMs: number,
  fetcher: () => Promise<T>,
  nowMs: number = Date.now(),
): Promise<CachedValue<T>> => {
  const entry = entries.get(key) as Entry<T> | undefined
  if (entry !== undefined && nowMs - entry.refreshedAtMs >= maxAgeMs) {
    // Too old to serve (see header): drop it so the path below behaves like an
    // initial fetch — blocking, and throwing to the caller on failure.
    logger.warn(
      `Cached tradinghours schedule is older than maxAgeMs=${maxAgeMs} (refreshedAtMs=${entry.refreshedAtMs}); discarding it and refetching in the foreground`,
    )
    entries.delete(key)
  }
  if (entries.get(key) === undefined) {
    const value = await fetcher()
    entries.set(key, { value, refreshedAtMs: nowMs })
    return { value, refreshedAtMs: nowMs, ttlMs, stale: false }
  }

  const current = entries.get(key) as Entry<T>
  const stale = nowMs - current.refreshedAtMs >= ttlMs
  if (stale) {
    refreshInBackground(key, fetcher)
  }
  return { value: current.value, refreshedAtMs: current.refreshedAtMs, ttlMs, stale }
}

// Fire-and-forget refresh, deduped per key: concurrent stale hits share one
// in-flight fetch. A failed refresh keeps the previous value (callers keep getting
// it, marked stale) and logs once per failure rather than per served request.
// refreshedAtMs deliberately stamps with the wall clock here (Date.now()) rather
// than a caller-injected time: the refresh runs detached from any request, so no
// request's nowMs applies. Under jest fake timers Date.now() is faked too, so
// tests that fake time still see consistent stamps.
const refreshInBackground = <T>(key: string, fetcher: () => Promise<T>): void => {
  if (inFlightRefreshes.has(key)) {
    return
  }
  const refresh = (async () => {
    try {
      const value = await fetcher()
      entries.set(key, { value, refreshedAtMs: Date.now() })
    } catch (e) {
      logger.warn(
        `Background refresh of the tradinghours session schedule failed; serving the stale schedule: ${e}`,
      )
    } finally {
      inFlightRefreshes.delete(key)
    }
  })()
  inFlightRefreshes.set(key, refresh)
}

// Test hook: clear all cached values and in-flight refreshes.
export const clearSessionTransitionCache = (): void => {
  entries.clear()
  inFlightRefreshes.clear()
}
