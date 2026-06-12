import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { TZDate } from '@date-fns/tz'
import { getStatusFromStaticSchedule } from '../../src/source/static'
import { expectClosesAt, expectOpensAt } from './utils'

describe('getStatusFromStaticSchedule (STATIC_ICE_EUROPE_ENERGY)', () => {
  const TZ = 'America/New_York'

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('holidays (every HOLIDAY_SCHEDULE window in static-ice-europe-energy.ts)', () => {
    describe('Memorial Day: May 25 1:30 PM ET – May 25 8:00 PM ET', () => {
      it('closes when the holiday window starts (May 25 1:30 PM ET)', () => {
        expectClosesAt('STATIC_ICE_EUROPE_ENERGY', new TZDate(2026, 4, 25, 13, 30, 0, 0, TZ))
      })

      it('is closed during the window (May 25 2:00 PM ET)', () => {
        jest.setSystemTime(new TZDate(2026, 4, 25, 14, 0, 0, 0, TZ).getTime())
        expect(getStatusFromStaticSchedule('STATIC_ICE_EUROPE_ENERGY').marketStatus).toEqual(
          MarketStatus.CLOSED,
        )
      })

      it('reopens when the holiday window ends (May 25 8:00 PM ET)', () => {
        expectOpensAt('STATIC_ICE_EUROPE_ENERGY', new TZDate(2026, 4, 25, 20, 0, 0, 0, TZ))
      })

      it('is open the next day outside the window (May 26 noon ET)', () => {
        jest.setSystemTime(new TZDate(2026, 4, 26, 12, 0, 0, 0, TZ).getTime())
        expect(getStatusFromStaticSchedule('STATIC_ICE_EUROPE_ENERGY').marketStatus).toEqual(
          MarketStatus.OPEN,
        )
      })
    })

    describe('Juneteenth weekend: Jun 19 1:30 PM ET – Jun 21 6:00 PM ET', () => {
      it('closes when the holiday window starts (Jun 19 1:30 PM ET)', () => {
        expectClosesAt('STATIC_ICE_EUROPE_ENERGY', new TZDate(2026, 5, 19, 13, 30, 0, 0, TZ))
      })

      it('is closed Fri Jun 19 afternoon, Sat Jun 20, and Sun Jun 21 before 6 PM ET', () => {
        jest.setSystemTime(new TZDate(2026, 5, 19, 14, 0, 0, 0, TZ).getTime())
        expect(getStatusFromStaticSchedule('STATIC_ICE_EUROPE_ENERGY').marketStatus).toEqual(
          MarketStatus.CLOSED,
        )
        jest.setSystemTime(new TZDate(2026, 5, 20, 12, 0, 0, 0, TZ).getTime())
        expect(getStatusFromStaticSchedule('STATIC_ICE_EUROPE_ENERGY').marketStatus).toEqual(
          MarketStatus.CLOSED,
        )
        jest.setSystemTime(new TZDate(2026, 5, 21, 12, 0, 0, 0, TZ).getTime())
        expect(getStatusFromStaticSchedule('STATIC_ICE_EUROPE_ENERGY').marketStatus).toEqual(
          MarketStatus.CLOSED,
        )
      })

      it('reopens at Sun Jun 21 6:00 PM ET (holiday end; regular Sun open)', () => {
        expectOpensAt('STATIC_ICE_EUROPE_ENERGY', new TZDate(2026, 5, 21, 18, 0, 0, 0, TZ))
      })
    })

    describe('Independence Day weekend: Jul 3 1:30 PM ET – Jul 5 6:00 PM ET', () => {
      it('closes when the holiday window starts (Jul 3 1:30 PM ET)', () => {
        expectClosesAt('STATIC_ICE_EUROPE_ENERGY', new TZDate(2026, 6, 3, 13, 30, 0, 0, TZ))
      })

      it('is closed Jul 4 noon ET and Sun Jul 5 before 6 PM ET', () => {
        jest.setSystemTime(new TZDate(2026, 6, 4, 12, 0, 0, 0, TZ).getTime())
        expect(getStatusFromStaticSchedule('STATIC_ICE_EUROPE_ENERGY').marketStatus).toEqual(
          MarketStatus.CLOSED,
        )
        jest.setSystemTime(new TZDate(2026, 6, 5, 12, 0, 0, 0, TZ).getTime())
        expect(getStatusFromStaticSchedule('STATIC_ICE_EUROPE_ENERGY').marketStatus).toEqual(
          MarketStatus.CLOSED,
        )
      })

      it('reopens at Sun Jul 5 6:00 PM ET', () => {
        expectOpensAt('STATIC_ICE_EUROPE_ENERGY', new TZDate(2026, 6, 5, 18, 0, 0, 0, TZ))
      })
    })

    describe('Labor Day: Sep 7 1:30 PM ET – Sep 7 8:00 PM ET', () => {
      it('closes when the holiday window starts (Sep 7 1:30 PM ET)', () => {
        expectClosesAt('STATIC_ICE_EUROPE_ENERGY', new TZDate(2026, 8, 7, 13, 30, 0, 0, TZ))
      })

      it('is closed during the window (Sep 7 2:00 PM ET)', () => {
        jest.setSystemTime(new TZDate(2026, 8, 7, 14, 0, 0, 0, TZ).getTime())
        expect(getStatusFromStaticSchedule('STATIC_ICE_EUROPE_ENERGY').marketStatus).toEqual(
          MarketStatus.CLOSED,
        )
      })

      it('reopens when the holiday window ends (Sep 7 8:00 PM ET)', () => {
        expectOpensAt('STATIC_ICE_EUROPE_ENERGY', new TZDate(2026, 8, 7, 20, 0, 0, 0, TZ))
      })

      it('is open the next day outside the window (Sep 8 noon ET)', () => {
        jest.setSystemTime(new TZDate(2026, 8, 8, 12, 0, 0, 0, TZ).getTime())
        expect(getStatusFromStaticSchedule('STATIC_ICE_EUROPE_ENERGY').marketStatus).toEqual(
          MarketStatus.OPEN,
        )
      })
    })

    describe('Thanksgiving (Nov 26) + day after (Nov 27 3:00 PM – Nov 28 6:00 PM ET)', () => {
      it('closes when the Thanksgiving window starts (Nov 26 1:30 PM ET)', () => {
        expectClosesAt('STATIC_ICE_EUROPE_ENERGY', new TZDate(2026, 10, 26, 13, 30, 0, 0, TZ))
      })

      it('is closed during the Thanksgiving window (Nov 26 2:00 PM ET)', () => {
        jest.setSystemTime(new TZDate(2026, 10, 26, 14, 0, 0, 0, TZ).getTime())
        expect(getStatusFromStaticSchedule('STATIC_ICE_EUROPE_ENERGY').marketStatus).toEqual(
          MarketStatus.CLOSED,
        )
      })

      it('reopens when the Thanksgiving window ends (Nov 26 8:00 PM ET)', () => {
        expectOpensAt('STATIC_ICE_EUROPE_ENERGY', new TZDate(2026, 10, 26, 20, 0, 0, 0, TZ))
      })

      it('is open after Thanksgiving before the Black Friday window (Nov 27 2:00 PM ET)', () => {
        jest.setSystemTime(new TZDate(2026, 10, 27, 14, 0, 0, 0, TZ).getTime())
        expect(getStatusFromStaticSchedule('STATIC_ICE_EUROPE_ENERGY').marketStatus).toEqual(
          MarketStatus.OPEN,
        )
      })

      it('closes when the Black Friday window starts (Nov 27 3:00 PM ET)', () => {
        expectClosesAt('STATIC_ICE_EUROPE_ENERGY', new TZDate(2026, 10, 27, 15, 0, 0, 0, TZ))
      })

      it('is closed during the Black Friday window (Nov 27 4:00 PM and Nov 28 noon ET)', () => {
        jest.setSystemTime(new TZDate(2026, 10, 27, 16, 0, 0, 0, TZ).getTime())
        expect(getStatusFromStaticSchedule('STATIC_ICE_EUROPE_ENERGY').marketStatus).toEqual(
          MarketStatus.CLOSED,
        )
        jest.setSystemTime(new TZDate(2026, 10, 28, 12, 0, 0, 0, TZ).getTime())
        expect(getStatusFromStaticSchedule('STATIC_ICE_EUROPE_ENERGY').marketStatus).toEqual(
          MarketStatus.CLOSED,
        )
      })

      it('is closed Nov 28 6:00 PM ET (holiday ends then, but 2026-11-28 is Saturday — still Fri–Sun weekly close)', () => {
        jest.setSystemTime(new TZDate(2026, 10, 28, 18, 0, 0, 0, TZ).getTime())
        expect(getStatusFromStaticSchedule('STATIC_ICE_EUROPE_ENERGY').marketStatus).toEqual(
          MarketStatus.CLOSED,
        )
      })

      it('opens at 6:00 PM ET on Sun Nov 29, 2026 (first regular reopen after Black Friday window + weekend)', () => {
        expectOpensAt('STATIC_ICE_EUROPE_ENERGY', new TZDate(2026, 10, 29, 18, 0, 0, 0, TZ))
      })
    })

    describe('Christmas: Dec 24 2:00 PM ET – Dec 27 6:00 PM ET', () => {
      it('closes when the holiday window starts (Dec 24 2:00 PM ET)', () => {
        expectClosesAt('STATIC_ICE_EUROPE_ENERGY', new TZDate(2026, 11, 24, 14, 0, 0, 0, TZ))
      })

      it('is closed Dec 25 and Dec 27 before 6 PM ET', () => {
        jest.setSystemTime(new TZDate(2026, 11, 25, 12, 0, 0, 0, TZ).getTime())
        expect(getStatusFromStaticSchedule('STATIC_ICE_EUROPE_ENERGY').marketStatus).toEqual(
          MarketStatus.CLOSED,
        )
        jest.setSystemTime(new TZDate(2026, 11, 27, 12, 0, 0, 0, TZ).getTime())
        expect(getStatusFromStaticSchedule('STATIC_ICE_EUROPE_ENERGY').marketStatus).toEqual(
          MarketStatus.CLOSED,
        )
      })

      it('reopens at Sun Dec 27 6:00 PM ET', () => {
        expectOpensAt('STATIC_ICE_EUROPE_ENERGY', new TZDate(2026, 11, 27, 18, 0, 0, 0, TZ))
      })
    })

    describe('New Year: Dec 31 3:00 PM ET 2026 – Jan 3 6:00 PM ET 2027', () => {
      it('closes when the holiday window starts (Dec 31 3:00 PM ET)', () => {
        expectClosesAt('STATIC_ICE_EUROPE_ENERGY', new TZDate(2026, 11, 31, 15, 0, 0, 0, TZ))
      })

      it('is closed Dec 31 after 3 PM ET, Jan 1 2027, and Jan 3 before 6 PM ET', () => {
        jest.setSystemTime(new TZDate(2026, 11, 31, 16, 0, 0, 0, TZ).getTime())
        expect(getStatusFromStaticSchedule('STATIC_ICE_EUROPE_ENERGY').marketStatus).toEqual(
          MarketStatus.CLOSED,
        )
        jest.setSystemTime(new TZDate(2027, 0, 1, 12, 0, 0, 0, TZ).getTime())
        expect(getStatusFromStaticSchedule('STATIC_ICE_EUROPE_ENERGY').marketStatus).toEqual(
          MarketStatus.CLOSED,
        )
        jest.setSystemTime(new TZDate(2027, 0, 3, 12, 0, 0, 0, TZ).getTime())
        expect(getStatusFromStaticSchedule('STATIC_ICE_EUROPE_ENERGY').marketStatus).toEqual(
          MarketStatus.CLOSED,
        )
      })

      it('reopens at Sun Jan 3 2027 6:00 PM ET', () => {
        expectOpensAt('STATIC_ICE_EUROPE_ENERGY', new TZDate(2027, 0, 3, 18, 0, 0, 0, TZ))
      })
    })
  })

  describe('weekend (Friday 6PM ET – Sunday 6PM ET)', () => {
    it('closes at Friday 6:00 PM ET (Jan 9, 2026)', () => {
      expectClosesAt('STATIC_ICE_EUROPE_ENERGY', new TZDate(2026, 0, 9, 18, 0, 0, 0, TZ))
    })

    it('reopens at Sunday 6:00 PM ET (Jan 11, 2026)', () => {
      expectOpensAt('STATIC_ICE_EUROPE_ENERGY', new TZDate(2026, 0, 11, 18, 0, 0, 0, TZ))
    })

    it('is closed at Saturday noon ET (Jan 10, 2026)', () => {
      jest.setSystemTime(new TZDate(2026, 0, 10, 12, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_ICE_EUROPE_ENERGY').marketStatus).toEqual(
        MarketStatus.CLOSED,
      )
    })
  })

  describe('daily pause (6:00 PM – 8:00 PM ET Mon–Thu; Sunday excluded by implementation)', () => {
    it('closes at 6:00 PM and reopens at 8:00 PM ET on Monday (Jan 12, 2026)', () => {
      expectClosesAt('STATIC_ICE_EUROPE_ENERGY', new TZDate(2026, 0, 12, 18, 0, 0, 0, TZ))
      expectOpensAt('STATIC_ICE_EUROPE_ENERGY', new TZDate(2026, 0, 12, 20, 0, 0, 0, TZ))
    })

    it('closes at 6:00 PM and reopens at 8:00 PM ET on Thursday (Jan 15, 2026)', () => {
      expectClosesAt('STATIC_ICE_EUROPE_ENERGY', new TZDate(2026, 0, 15, 18, 0, 0, 0, TZ))
      expectOpensAt('STATIC_ICE_EUROPE_ENERGY', new TZDate(2026, 0, 15, 20, 0, 0, 0, TZ))
    })

    it('is open at 7:00 PM ET on Sunday during the same clock window (Jan 11, 2026)', () => {
      jest.setSystemTime(new TZDate(2026, 0, 11, 19, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_ICE_EUROPE_ENERGY').marketStatus).toEqual(
        MarketStatus.OPEN,
      )
    })
  })

  describe('open', () => {
    it('is open at 10:00 AM ET on a weekday (Jan 12, 2026)', () => {
      jest.setSystemTime(new TZDate(2026, 0, 12, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_ICE_EUROPE_ENERGY').marketStatus).toEqual(
        MarketStatus.OPEN,
      )
    })

    it('is open at 5:00 PM ET on Friday before the weekend close (Jan 9, 2026)', () => {
      jest.setSystemTime(new TZDate(2026, 0, 9, 17, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_ICE_EUROPE_ENERGY').marketStatus).toEqual(
        MarketStatus.OPEN,
      )
    })

    it('is open at 9:00 PM ET on Monday after the pause (Jan 12, 2026)', () => {
      jest.setSystemTime(new TZDate(2026, 0, 12, 21, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_ICE_EUROPE_ENERGY').marketStatus).toEqual(
        MarketStatus.OPEN,
      )
    })
  })
})
