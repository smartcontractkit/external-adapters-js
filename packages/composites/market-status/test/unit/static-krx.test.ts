import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { TZDate } from '@date-fns/tz'
import { getStatusFromStaticSchedule } from '../../src/source/static'
import { expectClosesAt, expectOpensAt } from './utils'

describe('getStatusFromStaticSchedule (STATIC_KRX)', () => {
  const TZ = 'Asia/Seoul'

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('holidays (HOLIDAY_SCHEDULE in static-krx.ts)', () => {
    it('May 1: closes at 15:20 KST Apr 30, closed May 1 10:00, reopens at 9AM KST May 4 2026', () => {
      expectClosesAt('STATIC_KRX', new TZDate(2026, 3, 30, 15, 20, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 4, 1, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_KRX').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_KRX', new TZDate(2026, 4, 4, 9, 0, 0, 0, TZ))
    })

    it('May 5: closes at 15:20 KST May 4, closed May 5 10:00, reopens at 9AM KST May 6 2026', () => {
      expectClosesAt('STATIC_KRX', new TZDate(2026, 4, 4, 15, 20, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 4, 5, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_KRX').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_KRX', new TZDate(2026, 4, 6, 9, 0, 0, 0, TZ))
    })

    it('May 25: closes at 15:20 KST May 22, closed May 25 10:00, reopens at 9AM KST May 26 2026', () => {
      expectClosesAt('STATIC_KRX', new TZDate(2026, 4, 22, 15, 20, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 4, 25, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_KRX').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_KRX', new TZDate(2026, 4, 26, 9, 0, 0, 0, TZ))
    })

    it('Aug 17: closes at 15:20 KST Aug 13, closed Aug 17 10:00, reopens at 9AM KST Aug 18 2026', () => {
      expectClosesAt('STATIC_KRX', new TZDate(2026, 7, 13, 15, 20, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 7, 17, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_KRX').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_KRX', new TZDate(2026, 7, 18, 9, 0, 0, 0, TZ))
    })

    it('Sep 24–25: closes at 15:20 KST Sep 23, closed Sep 24–25 10:00, reopens at 9AM KST Sep 28 2026', () => {
      expectClosesAt('STATIC_KRX', new TZDate(2026, 8, 23, 15, 20, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 8, 24, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_KRX').marketStatus).toEqual(MarketStatus.CLOSED)
      jest.setSystemTime(new TZDate(2026, 8, 25, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_KRX').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_KRX', new TZDate(2026, 8, 28, 9, 0, 0, 0, TZ))
    })

    it('Oct 5: closes at 15:20 KST Oct 2, closed Oct 5 10:00, reopens at 9AM KST Oct 6 2026', () => {
      expectClosesAt('STATIC_KRX', new TZDate(2026, 9, 2, 15, 20, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 9, 5, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_KRX').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_KRX', new TZDate(2026, 9, 6, 9, 0, 0, 0, TZ))
    })

    describe('Nov 19: (9:00–10:00 closed, 15:20–16:20 open)', () => {
      it('is closed at 9:30 KST on Nov 19, 2026', () => {
        jest.setSystemTime(new TZDate(2026, 10, 19, 9, 30, 0, 0, TZ).getTime())
        expect(getStatusFromStaticSchedule('STATIC_KRX').marketStatus).toEqual(MarketStatus.CLOSED)
      })

      it('is open at 10:00 KST on Nov 19, 2026', () => {
        expectOpensAt('STATIC_KRX', new TZDate(2026, 10, 19, 10, 0, 0, 0, TZ))
      })

      it('is open at 15:30 KST on Nov 19, 2026', () => {
        jest.setSystemTime(new TZDate(2026, 10, 19, 15, 30, 0, 0, TZ).getTime())
        expect(getStatusFromStaticSchedule('STATIC_KRX').marketStatus).toEqual(MarketStatus.OPEN)
      })

      it('is closed at 16:20 KST on Nov 19, 2026', () => {
        expectClosesAt('STATIC_KRX', new TZDate(2026, 10, 19, 16, 20, 0, 0, TZ))
      })
    })

    it('Dec 25: closes at 15:20 KST Dec 24, closed Dec 25 10:00, reopens at 9AM KST Dec 28 2026', () => {
      expectClosesAt('STATIC_KRX', new TZDate(2026, 11, 24, 15, 20, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 11, 25, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_KRX').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_KRX', new TZDate(2026, 11, 28, 9, 0, 0, 0, TZ))
    })

    it('Dec 31: closes at 15:20 KST Dec 30, closed Dec 31 10:00, reopens at 9AM KST Jan 1 2027 (not in schedule)', () => {
      expectClosesAt('STATIC_KRX', new TZDate(2026, 11, 30, 15, 20, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 11, 31, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_KRX').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_KRX', new TZDate(2027, 0, 1, 9, 0, 0, 0, TZ))
    })
  })

  describe('weekend (Friday close - Monday 9AM KST open)', () => {
    it('closes at Friday 15:20 KST (Jan 9, 2026)', () => {
      expectClosesAt('STATIC_KRX', new TZDate(2026, 0, 9, 15, 20, 0, 0, TZ))
    })

    it('reopens at Monday 9AM KST (Jan 12, 2026)', () => {
      expectOpensAt('STATIC_KRX', new TZDate(2026, 0, 12, 9, 0, 0, 0, TZ))
    })
  })

  describe('end of day (15:20 KST)', () => {
    it('closes at 15:20 KST on a weekday (Jan 12, 2026)', () => {
      expectClosesAt('STATIC_KRX', new TZDate(2026, 0, 12, 15, 20, 0, 0, TZ))
    })
  })

  describe('open', () => {
    it('is open at 10AM KST on a weekday (Jan 12, 2026)', () => {
      jest.setSystemTime(new TZDate(2026, 0, 12, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_KRX').marketStatus).toEqual(MarketStatus.OPEN)
    })

    it('is open at 2PM KST on a weekday (Jan 12, 2026)', () => {
      jest.setSystemTime(new TZDate(2026, 0, 12, 14, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_KRX').marketStatus).toEqual(MarketStatus.OPEN)
    })
  })
})
