import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'

import {
  clearSessionTransitionCache,
  getCachedValue,
} from '../../../src/lib/session/transitionCache'

LoggerFactoryProvider.set()

// Unit tests for the stale-while-revalidate schedule cache (transitionCache.ts):
// callers always get a value when one exists (stale entries are served while a
// deduped background refresh runs), only the initial fetch blocks — and stale
// serving is bounded by maxAgeMs, past which the entry is discarded and the fetch
// blocks (and throws) like the initial one, so the caller falls back.

const VALUE = [{ status: 2, timeMs: 1, endTimeMs: 2 }]
const REFRESHED = [{ status: 2, timeMs: 3, endTimeMs: 4 }]

// Flush microtasks so a fire-and-forget background refresh settles before assertions.
const flushBackground = () => new Promise(process.nextTick)

describe('transitionCache', () => {
  beforeEach(() => {
    clearSessionTransitionCache()
  })

  it('blocks on the initial fetch and returns a fresh entry', async () => {
    const fetcher = jest.fn().mockResolvedValue(VALUE)

    const entry = await getCachedValue('k', 60_000, 3_600_000, fetcher, 1_000)

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(entry).toEqual({ value: VALUE, refreshedAtMs: 1_000, ttlMs: 60_000, stale: false })
  })

  it('propagates an initial fetch failure (no value to serve)', async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error('tradinghours down'))

    await expect(getCachedValue('k', 60_000, 3_600_000, fetcher, 1_000)).rejects.toThrow(
      'tradinghours down',
    )
  })

  it('serves the cached value within the TTL without refetching', async () => {
    const fetcher = jest.fn().mockResolvedValue(VALUE)

    await getCachedValue('k', 60_000, 3_600_000, fetcher, 1_000)
    const hit = await getCachedValue('k', 60_000, 3_600_000, fetcher, 1_000 + 59_999)

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(hit.stale).toBe(false)
    expect(hit.value).toBe(VALUE)
  })

  it('serves the stale value past the TTL and refreshes in the background', async () => {
    const fetcher = jest.fn().mockResolvedValueOnce(VALUE).mockResolvedValueOnce(REFRESHED)

    await getCachedValue('k', 60_000, 3_600_000, fetcher, 1_000)

    const staleHit = await getCachedValue('k', 60_000, 3_600_000, fetcher, 1_000 + 60_000)
    // The caller gets the stale value immediately, with the staleness signal.
    expect(staleHit).toEqual({ value: VALUE, refreshedAtMs: 1_000, ttlMs: 60_000, stale: true })

    await flushBackground()

    // The background refresh landed: the next hit is fresh with the new value.
    const refreshedHit = await getCachedValue('k', 60_000, 3_600_000, fetcher, 1_000 + 60_001)
    expect(refreshedHit.value).toBe(REFRESHED)
    expect(refreshedHit.stale).toBe(false)
    expect(refreshedHit.refreshedAtMs).toBeGreaterThan(1_000)
  })

  it('dedupes concurrent background refreshes into one fetch', async () => {
    let resolveRefresh: (v: typeof REFRESHED) => void = () => undefined
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(VALUE)
      .mockImplementationOnce(() => new Promise((resolve) => (resolveRefresh = resolve as never)))

    await getCachedValue('k', 60_000, 3_600_000, fetcher, 1_000)

    // Two stale hits while the background refresh is still in flight.
    await getCachedValue('k', 60_000, 3_600_000, fetcher, 1_000 + 60_000)
    await getCachedValue('k', 60_000, 3_600_000, fetcher, 1_000 + 60_000)
    expect(fetcher).toHaveBeenCalledTimes(2) // initial + one deduped refresh

    resolveRefresh(REFRESHED)
    await flushBackground()
  })

  it('keeps serving the stale value when the background refresh fails', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(VALUE)
      .mockRejectedValueOnce(new Error('tradinghours down'))

    await getCachedValue('k', 60_000, 3_600_000, fetcher, 1_000)
    await getCachedValue('k', 60_000, 3_600_000, fetcher, 1_000 + 60_000)
    await flushBackground()

    const stillStale = await getCachedValue('k', 60_000, 3_600_000, fetcher, 1_000 + 61_000)
    expect(stillStale.value).toBe(VALUE)
    expect(stillStale.refreshedAtMs).toBe(1_000)
    expect(stillStale.stale).toBe(true)
  })

  it('caches per key', async () => {
    const fetcherA = jest.fn().mockResolvedValue(VALUE)
    const fetcherB = jest.fn().mockResolvedValue(REFRESHED)

    const a = await getCachedValue('a', 60_000, 3_600_000, fetcherA, 1_000)
    const b = await getCachedValue('b', 60_000, 3_600_000, fetcherB, 1_000)

    expect(a.value).toBe(VALUE)
    expect(b.value).toBe(REFRESHED)
    expect(fetcherA).toHaveBeenCalledTimes(1)
    expect(fetcherB).toHaveBeenCalledTimes(1)
  })

  it('discards an entry older than maxAgeMs and refetches in the foreground', async () => {
    const fetcher = jest.fn().mockResolvedValueOnce(VALUE).mockResolvedValueOnce(REFRESHED)

    await getCachedValue('k', 60_000, 3_600_000, fetcher, 1_000)

    // Past maxAgeMs: the stale entry is not served; the fetch blocks and the
    // caller gets the fresh value.
    const refetched = await getCachedValue('k', 60_000, 3_600_000, fetcher, 1_000 + 3_600_000)
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(refetched).toEqual({
      value: REFRESHED,
      refreshedAtMs: 1_000 + 3_600_000,
      ttlMs: 60_000,
      stale: false,
    })
  })

  it('throws on a foreground refetch failure past maxAgeMs (caller falls back)', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(VALUE)
      .mockRejectedValueOnce(new Error('tradinghours down'))

    await getCachedValue('k', 60_000, 3_600_000, fetcher, 1_000)

    await expect(
      getCachedValue('k', 60_000, 3_600_000, fetcher, 1_000 + 3_600_000),
    ).rejects.toThrow('tradinghours down')

    // The too-old entry is gone: a later call still blocks on the fetch rather
    // than resurrecting the discarded schedule.
    fetcher.mockResolvedValueOnce(REFRESHED)
    const next = await getCachedValue('k', 60_000, 3_600_000, fetcher, 1_000 + 3_600_001)
    expect(next.value).toBe(REFRESHED)
  })
})
