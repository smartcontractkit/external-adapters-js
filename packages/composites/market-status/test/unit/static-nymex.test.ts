import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { TZDate } from '@date-fns/tz'
import { getStatusFromStaticSchedule } from '../../src/source/static'

describe('getStatusFromStaticSchedule (STATIC_NYMEX)', () => {
  const TZ = 'US/Central'

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('holidays', () => {
    it('returns CLOSED for Memorial Day early close (May 25, 2026 1:30PM-5PM CT)', () => {
      jest.setSystemTime(new TZDate(2026, 4, 25, 14, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_NYMEX').marketStatus).toEqual(MarketStatus.CLOSED)
    })

    it('returns CLOSED for Juneteenth (Jun 19, 2026 12PM CT - Jun 21 5PM CT)', () => {
      jest.setSystemTime(new TZDate(2026, 5, 19, 14, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_NYMEX').marketStatus).toEqual(MarketStatus.CLOSED)
    })

    it('returns CLOSED for Independence Day (Jul 3, 2026 12PM CT - Jul 5 5PM CT)', () => {
      jest.setSystemTime(new TZDate(2026, 6, 3, 14, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_NYMEX').marketStatus).toEqual(MarketStatus.CLOSED)
    })

    it('returns CLOSED for Labor Day early close (Sep 7, 2026 1:30PM-5PM CT)', () => {
      jest.setSystemTime(new TZDate(2026, 8, 7, 14, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_NYMEX').marketStatus).toEqual(MarketStatus.CLOSED)
    })

    it('returns CLOSED for Thanksgiving early close (Nov 26, 2026 1:30PM-5PM CT)', () => {
      jest.setSystemTime(new TZDate(2026, 10, 26, 14, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_NYMEX').marketStatus).toEqual(MarketStatus.CLOSED)
    })

    it('returns CLOSED for day after Thanksgiving (Nov 27, 2026 1:45PM CT - Nov 29 5PM CT)', () => {
      jest.setSystemTime(new TZDate(2026, 10, 27, 14, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_NYMEX').marketStatus).toEqual(MarketStatus.CLOSED)
    })

    it('returns CLOSED for Christmas holiday (Dec 24, 2026 12:45PM CT - Dec 27 5PM CT)', () => {
      jest.setSystemTime(new TZDate(2026, 11, 24, 13, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_NYMEX').marketStatus).toEqual(MarketStatus.CLOSED)
    })

    it('returns CLOSED for New Year holiday (Dec 31, 2026 4PM CT - Jan 3, 2027 5PM CT)', () => {
      jest.setSystemTime(new TZDate(2027, 0, 1, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_NYMEX').marketStatus).toEqual(MarketStatus.CLOSED)
    })
  })

  describe('weekend (Friday 4PM - Sunday 5PM CT)', () => {
    it('returns CLOSED on Friday after 4PM CT', () => {
      jest.setSystemTime(new TZDate(2026, 0, 16, 17, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_NYMEX').marketStatus).toEqual(MarketStatus.CLOSED)
    })

    it('returns CLOSED on Saturday', () => {
      jest.setSystemTime(new TZDate(2026, 0, 17, 12, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_NYMEX').marketStatus).toEqual(MarketStatus.CLOSED)
    })

    it('returns CLOSED on Sunday before 5PM CT', () => {
      jest.setSystemTime(new TZDate(2026, 0, 18, 14, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_NYMEX').marketStatus).toEqual(MarketStatus.CLOSED)
    })
  })

  describe('daily maintenance (4PM - 5PM CT)', () => {
    it('returns CLOSED during daily maintenance window on a weekday', () => {
      jest.setSystemTime(new TZDate(2026, 0, 12, 16, 30, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_NYMEX').marketStatus).toEqual(MarketStatus.CLOSED)
    })
  })

  describe('open', () => {
    it('returns OPEN on a weekday morning', () => {
      jest.setSystemTime(new TZDate(2026, 0, 12, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_NYMEX').marketStatus).toEqual(MarketStatus.OPEN)
    })

    it('returns OPEN on Sunday after 5PM CT', () => {
      jest.setSystemTime(new TZDate(2026, 0, 18, 18, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_NYMEX').marketStatus).toEqual(MarketStatus.OPEN)
    })
  })
})
