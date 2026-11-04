/** dxLink numbers are finite JSON numbers; strings/null/NaN/Infinity are null, never 0. */
export const toNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null
