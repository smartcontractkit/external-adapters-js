/**
 * Parses a dxLink double. Missing values (null) and the "NaN" / "Infinity" strings
 * dxLink uses for doubles without data all return null, so they can't pass as 0.
 */
export const toNumber = (value: unknown): number | null => {
  if (value == null) {
    return null
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/** Remembers the latest event time per key, so out-of-order events can be dropped. */
export class LatestTimes {
  private times = new Map<string, number>()

  /** Returns false if an event with a later time was already seen for this key. */
  isLatest(key: string, time: number | null): boolean {
    if (time === null) {
      return true
    }
    if (time < (this.times.get(key) ?? -Infinity)) {
      return false
    }
    this.times.set(key, time)
    return true
  }
}
