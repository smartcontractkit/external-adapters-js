import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { TZDate } from '@date-fns/tz'
import { getStatusFromStaticSchedule } from '../../src/source/static'
import { expectClosesAt, expectOpensAt } from './utils'

describe('getStatusFromStaticSchedule (STATIC_SSE)', () => {
  const TZ = 'Asia/Shanghai'

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('holidays', () => {
    it('Labour Day: closes at 14:57 CST Apr 30, closed all day May 1-5, reopens at 9:30 CST May 6 2026', () => {
      expectClosesAt('STATIC_SSE', new TZDate(2026, 3, 30, 14, 57, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 4, 1, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_SSE').marketStatus).toEqual(MarketStatus.CLOSED)
      jest.setSystemTime(new TZDate(2026, 4, 2, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_SSE').marketStatus).toEqual(MarketStatus.CLOSED)
      jest.setSystemTime(new TZDate(2026, 4, 3, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_SSE').marketStatus).toEqual(MarketStatus.CLOSED)
      jest.setSystemTime(new TZDate(2026, 4, 4, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_SSE').marketStatus).toEqual(MarketStatus.CLOSED)
      jest.setSystemTime(new TZDate(2026, 4, 5, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_SSE').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_SSE', new TZDate(2026, 4, 6, 9, 30, 0, 0, TZ))
    })

    it('Dragon Boat Festival: closes at 14:57 CST Jun 18, closed all day Jun 19, reopens at 9:30 CST Jun 22 2026', () => {
      expectClosesAt('STATIC_SSE', new TZDate(2026, 5, 18, 14, 57, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 5, 19, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_SSE').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_SSE', new TZDate(2026, 5, 22, 9, 30, 0, 0, TZ))
    })

    it('Mid-Autumn Festival: closes at 14:57 CST Sep 24, closed all day Sep 25 (Fri), reopens at 9:30 CST Sep 28 2026', () => {
      expectClosesAt('STATIC_SSE', new TZDate(2026, 8, 24, 14, 57, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 8, 25, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_SSE').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_SSE', new TZDate(2026, 8, 28, 9, 30, 0, 0, TZ))
    })

    it('National Day: closes at 14:57 CST Sep 30, closed all day Oct 1-7, reopens at 9:30 CST Oct 8 2026', () => {
      expectClosesAt('STATIC_SSE', new TZDate(2026, 8, 30, 14, 57, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 9, 1, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_SSE').marketStatus).toEqual(MarketStatus.CLOSED)
      jest.setSystemTime(new TZDate(2026, 9, 2, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_SSE').marketStatus).toEqual(MarketStatus.CLOSED)
      jest.setSystemTime(new TZDate(2026, 9, 3, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_SSE').marketStatus).toEqual(MarketStatus.CLOSED)
      jest.setSystemTime(new TZDate(2026, 9, 4, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_SSE').marketStatus).toEqual(MarketStatus.CLOSED)
      jest.setSystemTime(new TZDate(2026, 9, 5, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_SSE').marketStatus).toEqual(MarketStatus.CLOSED)
      jest.setSystemTime(new TZDate(2026, 9, 6, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_SSE').marketStatus).toEqual(MarketStatus.CLOSED)
      jest.setSystemTime(new TZDate(2026, 9, 7, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_SSE').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_SSE', new TZDate(2026, 9, 8, 9, 30, 0, 0, TZ))
    })
  })

  describe('weekend (Friday close - Monday 9:30 CST open)', () => {
    it('closes at Friday 14:57 CST (Jan 9, 2026)', () => {
      expectClosesAt('STATIC_SSE', new TZDate(2026, 0, 9, 14, 57, 0, 0, TZ))
    })

    it('reopens at Monday 9:30 CST (Jan 12, 2026)', () => {
      expectOpensAt('STATIC_SSE', new TZDate(2026, 0, 12, 9, 30, 0, 0, TZ))
    })
  })

  describe('lunch break (11:30 - 13:00 CST)', () => {
    it('closes at 11:30 and reopens at 13:00 CST on a weekday (Jan 12, 2026)', () => {
      expectClosesAt('STATIC_SSE', new TZDate(2026, 0, 12, 11, 30, 0, 0, TZ))
      expectOpensAt('STATIC_SSE', new TZDate(2026, 0, 12, 13, 0, 0, 0, TZ))
    })
  })

  describe('end of day (14:57 CST)', () => {
    it('closes at 14:57 CST on a weekday (Jan 12, 2026)', () => {
      expectClosesAt('STATIC_SSE', new TZDate(2026, 0, 12, 14, 57, 0, 0, TZ))
    })
  })

  describe('open', () => {
    it('is open at 10:30 CST on a weekday (Jan 12, 2026)', () => {
      jest.setSystemTime(new TZDate(2026, 0, 12, 10, 30, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_SSE').marketStatus).toEqual(MarketStatus.OPEN)
    })

    it('is open at 14:00 CST on a weekday (Jan 12, 2026)', () => {
      jest.setSystemTime(new TZDate(2026, 0, 12, 14, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_SSE').marketStatus).toEqual(MarketStatus.OPEN)
    })
  })
})
