/**
 * dxLink numeric fields are JSON numbers. The only string values the protocol
 * uses for doubles without data are "NaN"/"Infinity" (and any other string is
 * not a number), so only finite numbers pass. Nothing is coerced through
 * Number(), truthiness, or a default of 0.
 */
export const toNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null
