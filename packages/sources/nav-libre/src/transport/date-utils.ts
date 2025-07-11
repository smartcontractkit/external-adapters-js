import { differenceInBusinessDays, format, isValid, parse, subBusinessDays } from 'date-fns'

// Date format used by the NavLibre API
export const DATE_FORMAT = 'MM-dd-yyyy'
export const MAX_BUSINESS_DAYS = 7

/**
 * Parse a string in MM-DD-YYYY format.
 * Throws if the string is missing or malformed.
 */
export function parseDateString(dateStr: string): Date {
  const parsed = parse(dateStr, DATE_FORMAT, new Date())
  if (!isValid(parsed)) {
    throw new Error(`date must be in ${DATE_FORMAT} format: got "${dateStr}"`)
  }
  return new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()))
}

/** Returns a start date that is at most `maxBusinessDays` before `endDate`. */
export function clampStartByBusinessDays(
  from: Date,
  to: Date,
  maxBusinessDays = MAX_BUSINESS_DAYS,
): Date {
  const span = differenceInBusinessDays(to, from)
  return span > maxBusinessDays ? subBusinessDays(to, maxBusinessDays) : from
}

/** Convenience formatter so every outbound string is consistent. */
export function toDateString(d: Date): string {
  return format(d, DATE_FORMAT)
}
