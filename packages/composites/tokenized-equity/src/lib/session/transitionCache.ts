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
const entries = new Map<string, Entry<unknown>>()
const inFlightRefreshes = new Map<string, Promise<void>>()

export const getCachedValue = async <T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  nowMs: number = Date.now(),
): Promise<CachedValue<T>> => {
  const entry = entries.get(key) as Entry<T> | undefined
  if (entry === undefined) {
    const value = await fetcher()
    entries.set(key, { value, refreshedAtMs: nowMs })
    return { value, refreshedAtMs: nowMs, ttlMs, stale: false }
  }

  const stale = nowMs - entry.refreshedAtMs >= ttlMs
  if (stale) {
    refreshInBackground(key, fetcher)
  }
  return { value: entry.value, refreshedAtMs: entry.refreshedAtMs, ttlMs, stale }
}

// Fire-and-forget refresh, deduped per key: concurrent stale hits share one
// in-flight fetch. A failed refresh keeps the previous value (callers keep getting
// it, marked stale) and logs once per failure rather than per served request.
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
