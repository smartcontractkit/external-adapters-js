import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { TZDate } from '@date-fns/tz'
import { getStatusFromStaticSchedule } from '../../src/source/static'
import { expectClosesAt, expectOpensAt } from './utils'

describe('getStatusFromStaticSchedule (STATIC_JPX)', () => {
  const TZ = 'Asia/Tokyo'

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('holidays', () => {
    it('Showa Day: closes at 15:25 JST Apr 28, closed all day Apr 29, reopens at 9AM JST Apr 30 2026', () => {
      expectClosesAt('STATIC_JPX', new TZDate(2026, 3, 28, 15, 25, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 3, 29, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_JPX').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_JPX', new TZDate(2026, 3, 30, 9, 0, 0, 0, TZ))
    })

    it('Golden Week: closes at 15:25 JST May 1, closed all day May 4-6, reopens at 9AM JST May 7 2026', () => {
      expectClosesAt('STATIC_JPX', new TZDate(2026, 4, 1, 15, 25, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 4, 4, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_JPX').marketStatus).toEqual(MarketStatus.CLOSED)
      jest.setSystemTime(new TZDate(2026, 4, 5, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_JPX').marketStatus).toEqual(MarketStatus.CLOSED)
      jest.setSystemTime(new TZDate(2026, 4, 6, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_JPX').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_JPX', new TZDate(2026, 4, 7, 9, 0, 0, 0, TZ))
    })

    it('Marine Day: closes at 15:25 JST Jul 17, closed all day Jul 20, reopens at 9AM JST Jul 21 2026', () => {
      expectClosesAt('STATIC_JPX', new TZDate(2026, 6, 17, 15, 25, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 6, 20, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_JPX').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_JPX', new TZDate(2026, 6, 21, 9, 0, 0, 0, TZ))
    })

    it('Mountain Day: closes at 15:25 JST Aug 10, closed all day Aug 11, reopens at 9AM JST Aug 12 2026', () => {
      expectClosesAt('STATIC_JPX', new TZDate(2026, 7, 10, 15, 25, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 7, 11, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_JPX').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_JPX', new TZDate(2026, 7, 12, 9, 0, 0, 0, TZ))
    })

    it('Respect for the Aged Day + Autumnal Equinox: closes at 15:25 JST Sep 18, closed all day Sep 21-23, reopens at 9AM JST Sep 24 2026', () => {
      expectClosesAt('STATIC_JPX', new TZDate(2026, 8, 18, 15, 25, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 8, 21, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_JPX').marketStatus).toEqual(MarketStatus.CLOSED)
      jest.setSystemTime(new TZDate(2026, 8, 22, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_JPX').marketStatus).toEqual(MarketStatus.CLOSED)
      jest.setSystemTime(new TZDate(2026, 8, 23, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_JPX').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_JPX', new TZDate(2026, 8, 24, 9, 0, 0, 0, TZ))
    })

    it('Sports Day: closes at 15:25 JST Oct 9, closed all day Oct 12, reopens at 9AM JST Oct 13 2026', () => {
      expectClosesAt('STATIC_JPX', new TZDate(2026, 9, 9, 15, 25, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 9, 12, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_JPX').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_JPX', new TZDate(2026, 9, 13, 9, 0, 0, 0, TZ))
    })

    it('Culture Day: closes at 15:25 JST Nov 2, closed all day Nov 3, reopens at 9AM JST Nov 4 2026', () => {
      expectClosesAt('STATIC_JPX', new TZDate(2026, 10, 2, 15, 25, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 10, 3, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_JPX').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_JPX', new TZDate(2026, 10, 4, 9, 0, 0, 0, TZ))
    })

    it('Labor Thanksgiving Day: closes at 15:25 JST Nov 20, closed all day Nov 23, reopens at 9AM JST Nov 24 2026', () => {
      expectClosesAt('STATIC_JPX', new TZDate(2026, 10, 20, 15, 25, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 10, 23, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_JPX').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_JPX', new TZDate(2026, 10, 24, 9, 0, 0, 0, TZ))
    })

    it("New Year's Eve: closes at 15:25 JST Dec 30, closed all day Dec 31, reopens at 9AM JST Jan 1 2027", () => {
      expectClosesAt('STATIC_JPX', new TZDate(2026, 11, 30, 15, 25, 0, 0, TZ))
      jest.setSystemTime(new TZDate(2026, 11, 31, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_JPX').marketStatus).toEqual(MarketStatus.CLOSED)
      expectOpensAt('STATIC_JPX', new TZDate(2027, 0, 1, 9, 0, 0, 0, TZ))
    })
  })

  describe('weekend (Friday close - Monday 9AM JST open)', () => {
    it('closes at Friday 15:25 JST (Jan 9, 2026)', () => {
      expectClosesAt('STATIC_JPX', new TZDate(2026, 0, 9, 15, 25, 0, 0, TZ))
    })

    it('reopens at Monday 9AM JST (Jan 12, 2026)', () => {
      expectOpensAt('STATIC_JPX', new TZDate(2026, 0, 12, 9, 0, 0, 0, TZ))
    })
  })

  describe('lunch break (11:30 - 12:30 JST)', () => {
    it('closes at 11:30 and reopens at 12:30 JST on a weekday (Jan 12, 2026)', () => {
      expectClosesAt('STATIC_JPX', new TZDate(2026, 0, 12, 11, 30, 0, 0, TZ))
      expectOpensAt('STATIC_JPX', new TZDate(2026, 0, 12, 12, 30, 0, 0, TZ))
    })
  })

  describe('end of day (15:25 JST)', () => {
    it('closes at 15:25 JST on a weekday (Jan 12, 2026)', () => {
      expectClosesAt('STATIC_JPX', new TZDate(2026, 0, 12, 15, 25, 0, 0, TZ))
    })
  })

  describe('open', () => {
    it('is open at 10AM JST on a weekday (Jan 12, 2026)', () => {
      jest.setSystemTime(new TZDate(2026, 0, 12, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_JPX').marketStatus).toEqual(MarketStatus.OPEN)
    })

    it('is open at 1PM JST on a weekday (Jan 12, 2026)', () => {
      jest.setSystemTime(new TZDate(2026, 0, 12, 13, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_JPX').marketStatus).toEqual(MarketStatus.OPEN)
    })
  })
})
