import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { TZDate } from '@date-fns/tz'
import { getStatusFromStaticSchedule } from '../../src/source/static'
import { expectClosesAt, expectOpensAt } from './utils'

describe('getStatusFromStaticSchedule (STATIC_HKEX)', () => {
  const TZ = 'Asia/Hong_Kong'

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('holidays (HOLIDAY_SCHEDULE in static-hkex.ts)', () => {
    it('Oct 1: closes at 16:00 HKT Sep 30, closed Oct 1 10:00, reopens at 9:30AM HKT Oct 2 2026', () => {
      expectClosesAt('STATIC_HKEX', new TZDate(2026, 8, 30, 16, 0, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 9, 1, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_HKEX').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_HKEX', new TZDate(2026, 9, 2, 9, 30, 0, 0, TZ))
    })

    it('Oct 19: closes at 16:00 HKT Oct 16, closed Oct 19 10:00, reopens at 9:30AM HKT Oct 20 2026', () => {
      expectClosesAt('STATIC_HKEX', new TZDate(2026, 9, 16, 16, 0, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 9, 19, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_HKEX').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_HKEX', new TZDate(2026, 9, 20, 9, 30, 0, 0, TZ))
    })

    describe('Dec 24: half day (morning session only, closes 12:00 HKT)', () => {
      it('is open at 10:00 HKT on Dec 24, 2026', () => {
        jest.setSystemTime(new TZDate(2026, 11, 24, 10, 0, 0, 0, TZ).getTime())
        expect(getStatusFromStaticSchedule('STATIC_HKEX').marketStatus).toEqual(MarketStatus.OPEN)
      })

      it('closes at 12:00 HKT on Dec 24, 2026', () => {
        expectClosesAt('STATIC_HKEX', new TZDate(2026, 11, 24, 12, 0, 0, 0, TZ))
      })

      it('stays closed through the afternoon session on Dec 24, 2026', () => {
        jest.setSystemTime(new TZDate(2026, 11, 24, 14, 0, 0, 0, TZ).getTime())
        expect(getStatusFromStaticSchedule('STATIC_HKEX').marketStatus).toEqual(MarketStatus.CLOSED)
      })
    })

    it('Dec 25: closed Dec 25 10:00, reopens at 9:30AM HKT Dec 28 2026', () => {
      jest.setSystemTime(new TZDate(2026, 11, 25, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_HKEX').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_HKEX', new TZDate(2026, 11, 28, 9, 30, 0, 0, TZ))
    })

    describe('Dec 31: half day (morning session only, closes 12:00 HKT)', () => {
      it('is open at 10:00 HKT on Dec 31, 2026', () => {
        jest.setSystemTime(new TZDate(2026, 11, 31, 10, 0, 0, 0, TZ).getTime())
        expect(getStatusFromStaticSchedule('STATIC_HKEX').marketStatus).toEqual(MarketStatus.OPEN)
      })

      it('closes at 12:00 HKT on Dec 31, 2026', () => {
        expectClosesAt('STATIC_HKEX', new TZDate(2026, 11, 31, 12, 0, 0, 0, TZ))
      })

      it('stays closed through the afternoon session, reopens at 9:30AM HKT Jan 1 2027 (not in schedule)', () => {
        jest.setSystemTime(new TZDate(2026, 11, 31, 14, 0, 0, 0, TZ).getTime())
        expect(getStatusFromStaticSchedule('STATIC_HKEX').marketStatus).toEqual(MarketStatus.CLOSED)
        expectOpensAt('STATIC_HKEX', new TZDate(2027, 0, 1, 9, 30, 0, 0, TZ))
      })
    })
  })

  describe('weekend (Friday close - Monday 9:30AM HKT open)', () => {
    it('closes at Friday 16:00 HKT (Jan 9, 2026)', () => {
      expectClosesAt('STATIC_HKEX', new TZDate(2026, 0, 9, 16, 0, 0, 0, TZ))
    })

    it('reopens at Monday 9:30AM HKT (Jan 12, 2026)', () => {
      expectOpensAt('STATIC_HKEX', new TZDate(2026, 0, 12, 9, 30, 0, 0, TZ))
    })
  })

  describe('pre-opening auction (9:00 - 9:30 HKT)', () => {
    it('is closed at 9:00 HKT on a weekday (Jan 12, 2026)', () => {
      jest.setSystemTime(new TZDate(2026, 0, 12, 9, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_HKEX').marketStatus).toEqual(MarketStatus.CLOSED)
    })

    it('opens at 9:30 HKT on a weekday (Jan 12, 2026)', () => {
      expectOpensAt('STATIC_HKEX', new TZDate(2026, 0, 12, 9, 30, 0, 0, TZ))
    })
  })

  describe('lunch break (12:00 - 13:00 HKT)', () => {
    it('closes at 12:00 HKT on a weekday (Jan 12, 2026)', () => {
      expectClosesAt('STATIC_HKEX', new TZDate(2026, 0, 12, 12, 0, 0, 0, TZ))
    })

    it('reopens at 13:00 HKT on a weekday (Jan 12, 2026)', () => {
      expectOpensAt('STATIC_HKEX', new TZDate(2026, 0, 12, 13, 0, 0, 0, TZ))
    })
  })

  describe('end of day (16:00 HKT, closing auction 16:00 - 16:10 is closed)', () => {
    it('closes at 16:00 HKT on a weekday (Jan 12, 2026)', () => {
      expectClosesAt('STATIC_HKEX', new TZDate(2026, 0, 12, 16, 0, 0, 0, TZ))
    })

    it('is closed at 16:05 HKT on a weekday (Jan 12, 2026)', () => {
      jest.setSystemTime(new TZDate(2026, 0, 12, 16, 5, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_HKEX').marketStatus).toEqual(MarketStatus.CLOSED)
    })
  })

  describe('open', () => {
    it('is open at 10AM HKT on a weekday (Jan 12, 2026)', () => {
      jest.setSystemTime(new TZDate(2026, 0, 12, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_HKEX').marketStatus).toEqual(MarketStatus.OPEN)
    })

    it('is open at 2PM HKT on a weekday (Jan 12, 2026)', () => {
      jest.setSystemTime(new TZDate(2026, 0, 12, 14, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_HKEX').marketStatus).toEqual(MarketStatus.OPEN)
    })
  })
})
