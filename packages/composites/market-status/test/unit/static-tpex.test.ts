import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { TZDate } from '@date-fns/tz'
import { getStatusFromStaticSchedule } from '../../src/source/static'
import { expectClosesAt, expectOpensAt } from './utils'

describe('getStatusFromStaticSchedule (STATIC_TPEX)', () => {
  const TZ = 'Asia/Taipei'

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('holidays', () => {
    it('Labour Day: closes at 13:25 CST Apr 30, closed all day May 1, reopens at 9AM CST May 4 2026', () => {
      expectClosesAt('STATIC_TPEX', new TZDate(2026, 3, 30, 13, 25, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 4, 1, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_TPEX').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_TPEX', new TZDate(2026, 4, 4, 9, 0, 0, 0, TZ))
    })

    it('Jun 19 holiday: closes at 13:25 CST Jun 18, closed all day Jun 19, reopens at 9AM CST Jun 22 2026', () => {
      expectClosesAt('STATIC_TPEX', new TZDate(2026, 5, 18, 13, 25, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 5, 19, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_TPEX').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_TPEX', new TZDate(2026, 5, 22, 9, 0, 0, 0, TZ))
    })

    it('Mid-Autumn and Sep 28 substitute: closes at 13:25 CST Sep 24, closed Sep 25 and Sep 28, reopens at 9AM CST Sep 29 2026', () => {
      expectClosesAt('STATIC_TPEX', new TZDate(2026, 8, 24, 13, 25, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 8, 25, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_TPEX').marketStatus).toEqual(MarketStatus.CLOSED)
      jest.setSystemTime(new TZDate(2026, 8, 28, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_TPEX').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_TPEX', new TZDate(2026, 8, 29, 9, 0, 0, 0, TZ))
    })

    it('Oct 9 holiday: closes at 13:25 CST Oct 8, closed all day Oct 9, reopens at 9AM CST Oct 12 2026', () => {
      expectClosesAt('STATIC_TPEX', new TZDate(2026, 9, 8, 13, 25, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 9, 9, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_TPEX').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_TPEX', new TZDate(2026, 9, 12, 9, 0, 0, 0, TZ))
    })

    it('Oct 26 holiday: closes at 13:25 CST Oct 23, closed all day Oct 26, reopens at 9AM CST Oct 27 2026', () => {
      expectClosesAt('STATIC_TPEX', new TZDate(2026, 9, 23, 13, 25, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 9, 26, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_TPEX').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_TPEX', new TZDate(2026, 9, 27, 9, 0, 0, 0, TZ))
    })

    it('Christmas: closes at 13:25 CST Dec 24, closed all day Dec 25, reopens at 9AM CST Dec 28 2026', () => {
      expectClosesAt('STATIC_TPEX', new TZDate(2026, 11, 24, 13, 25, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 11, 25, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_TPEX').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_TPEX', new TZDate(2026, 11, 28, 9, 0, 0, 0, TZ))
    })
  })

  describe('weekend (Friday close - Monday 9AM CST open)', () => {
    it('closes at Friday 13:25 CST (Jan 9, 2026)', () => {
      expectClosesAt('STATIC_TPEX', new TZDate(2026, 0, 9, 13, 25, 0, 0, TZ))
    })

    it('reopens at Monday 9AM CST (Jan 12, 2026)', () => {
      expectOpensAt('STATIC_TPEX', new TZDate(2026, 0, 12, 9, 0, 0, 0, TZ))
    })
  })

  describe('end of day (13:25 CST)', () => {
    it('closes at 13:25 CST on a weekday (Jan 12, 2026)', () => {
      expectClosesAt('STATIC_TPEX', new TZDate(2026, 0, 12, 13, 25, 0, 0, TZ))
    })
  })

  describe('open', () => {
    it('is open at 10AM CST on a weekday (Jan 12, 2026)', () => {
      jest.setSystemTime(new TZDate(2026, 0, 12, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_TPEX').marketStatus).toEqual(MarketStatus.OPEN)
    })

    it('is open at 12PM CST on a weekday (Jan 12, 2026)', () => {
      jest.setSystemTime(new TZDate(2026, 0, 12, 12, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_TPEX').marketStatus).toEqual(MarketStatus.OPEN)
    })
  })
})
