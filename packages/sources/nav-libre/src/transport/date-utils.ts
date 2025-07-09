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
  return parsed
}

/** Ensure the window is <= N business days. Returns the (possibly adjusted) from-date. */
export function clampToBusinessWindow(
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
