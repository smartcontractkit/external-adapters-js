import { differenceInBusinessDays, parse } from 'date-fns'
import {
  accountingDateToNavTimestampMs,
  clampStartByBusinessDays,
  DATE_FORMAT,
  MAX_BUSINESS_DAYS,
  parseDateString,
  toDateString,
} from '../../src/transport/date-utils'

describe('date-utils', () => {
  // Force UTC so tests behave the same everywhere
  beforeAll(() => {
    process.env.TZ = 'UTC'
  })

  describe('parseDateString', () => {
    it('parses a valid MM-dd-yyyy string', () => {
      const input = '07-11-2025'
      const parsed = parseDateString(input)
      expect(parsed).toBeInstanceOf(Date)
      expect(parsed.getUTCFullYear()).toBe(2025)
      expect(parsed.getUTCMonth()).toBe(6) // July is 6 (zero‑based)
      expect(parsed.getUTCDate()).toBe(11)
    })

    it('throws for malformed input', () => {
      const badInput = '2025-07-11'
      expect(() => parseDateString(badInput)).toThrow(
        `date must be in ${DATE_FORMAT} format: got "${badInput}"`,
      )
    })
  })

  describe('accountingDateToNavTimestampMs', () => {
    it('adds the given UTC hour offset from midnight on the accounting date', () => {
      expect(accountingDateToNavTimestampMs('06-25-2025', 0)).toBe(
        Date.UTC(2025, 5, 25, 0, 0, 0, 0),
      )
      expect(accountingDateToNavTimestampMs('06-25-2025', 6)).toBe(
        Date.UTC(2025, 5, 25, 6, 0, 0, 0),
      )
      expect(accountingDateToNavTimestampMs('06-25-2025', 23)).toBe(
        Date.UTC(2025, 5, 25, 23, 0, 0, 0),
      )
    })
  })

  describe('clampStartByBusinessDays', () => {
    const to = parse('07-15-2025', DATE_FORMAT, new Date())

    it('returns the original from date when within the limit', () => {
      const from = parse('07-07-2025', DATE_FORMAT, new Date()) // 6 business days before
      const result = clampStartByBusinessDays(from, to, MAX_BUSINESS_DAYS)
      expect(result).toEqual(from)
    })

    it('clamps when span exceeds the limit', () => {
      const from = parse('07-01-2025', DATE_FORMAT, new Date()) // >7 business days
      const result = clampStartByBusinessDays(from, to, MAX_BUSINESS_DAYS)
      // Should be exactly MAX_BUSINESS_DAYS business days before `to`
      const span = differenceInBusinessDays(to, result)
      expect(span).toBe(MAX_BUSINESS_DAYS)
    })
  })

  describe('toDateString', () => {
    it('formats a Date back to MM-dd-yyyy', () => {
      const date = new Date(Date.UTC(2025, 6, 11))
      const formatted = toDateString(date)
      expect(formatted).toBe('07-11-2025')
    })
  })
})
