export class StaleTGuard {
  private lastT = new Map<string, number>()

  keep(key: string, t: number): boolean {
    const prev = this.lastT.get(key)
    if (prev !== undefined && t < prev) {
      return false
    }
    this.lastT.set(key, t)
    return true
  }

  reset(): void {
    this.lastT.clear()
  }
}

export const toNumber = (value: unknown): number | null => {
  // JS coerces null/undefined to 0 via Number(), which would let missing
  // provider data masquerade as a legitimate zero (e.g. bid/ask size of 0).
  if (value == null) return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

export const stripNullBytes = (value: string): string => value.replace(/\x00/g, '')
