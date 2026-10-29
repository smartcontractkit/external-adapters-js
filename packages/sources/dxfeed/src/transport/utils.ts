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
