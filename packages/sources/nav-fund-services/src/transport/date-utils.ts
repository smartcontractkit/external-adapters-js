import { tz } from '@date-fns/tz'
import { differenceInBusinessDays, format, isValid, parse, subBusinessDays } from 'date-fns'

// Date format used by the NavFundServices API
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

/**
 * Unix timestamp for the NAV accounting calendar date at `utcHourOffsetFromMidnight` hours UTC (0 = midnight).
 * Business-day logic should keep using {@link parseDateString} only; this is for consumer-facing timestamps.
 */
export function accountingDateToNavTimestampMs(
  accountingDateStr: string,
  utcHourOffsetFromMidnight: number,
): number {
  return parseDateString(accountingDateStr).getTime() + utcHourOffsetFromMidnight * 60 * 60 * 1000
}

/**
 * Guarantee the (from -> to) span is <= `maxBusinessDays`.
 *
 * If the gap is larger, shift `from` forward so it sits exactly
 * `maxBusinessDays` business days before `to` and returns the new `from`.
 *
 * Returns the original `from` if the gap is smaller or equal.
 *
 * Example: 7-day limit
 *   from = 2025-06-25   (Wed)
 *   to   = 2025-07-10   (Thu)
 *   span = 11 business days  ->  newFrom = 2025-07-01
 */
export function clampStartByBusinessDays(
  from: Date,
  to: Date,
  maxBusinessDays = MAX_BUSINESS_DAYS,
): Date {
  const span = differenceInBusinessDays(to, from, { in: tz('UTC') })
  return span > maxBusinessDays ? subBusinessDays(to, maxBusinessDays, { in: tz('UTC') }) : from
}

/** Convenience formatter: UTC calendar date as MM-dd-yyyy. */
export function toDateString(d: Date): string {
  return format(d, DATE_FORMAT, { in: tz('UTC') })
}
