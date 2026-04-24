import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { TZDate } from '@date-fns/tz'
import { getStatusFromStaticSchedule } from '../../src/source/static'
import { expectClosesAt, expectOpensAt } from './utils'

describe('getStatusFromStaticSchedule (STATIC_NYMEX)', () => {
  const TZ = 'US/Central'

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('holidays', () => {
    it('Memorial Day early close: closes at 1:30PM CT, reopens at 5PM CT (May 25, 2026)', () => {
      expectClosesAt('STATIC_NYMEX', new TZDate(2026, 4, 25, 13, 30, 0, 0, TZ))
      expectOpensAt('STATIC_NYMEX', new TZDate(2026, 4, 25, 17, 0, 0, 0, TZ))
    })

    it('Juneteenth: closes at 12PM Jun 19, reopens at 5PM Jun 21, 2026', () => {
      expectClosesAt('STATIC_NYMEX', new TZDate(2026, 5, 19, 12, 0, 0, 0, TZ))
      expectOpensAt('STATIC_NYMEX', new TZDate(2026, 5, 21, 17, 0, 0, 0, TZ))
    })

    it('Independence Day: closes at 12PM Jul 3, reopens at 5PM Jul 5, 2026', () => {
      expectClosesAt('STATIC_NYMEX', new TZDate(2026, 6, 3, 12, 0, 0, 0, TZ))
      expectOpensAt('STATIC_NYMEX', new TZDate(2026, 6, 5, 17, 0, 0, 0, TZ))
    })

    it('Labor Day early close: closes at 1:30PM CT, reopens at 5PM CT (Sep 7, 2026)', () => {
      expectClosesAt('STATIC_NYMEX', new TZDate(2026, 8, 7, 13, 30, 0, 0, TZ))
      expectOpensAt('STATIC_NYMEX', new TZDate(2026, 8, 7, 17, 0, 0, 0, TZ))
    })

    it('Thanksgiving early close: closes at 1:30PM CT, reopens at 5PM CT (Nov 26, 2026)', () => {
      expectClosesAt('STATIC_NYMEX', new TZDate(2026, 10, 26, 13, 30, 0, 0, TZ))
      expectOpensAt('STATIC_NYMEX', new TZDate(2026, 10, 26, 17, 0, 0, 0, TZ))
    })

    it('Day after Thanksgiving: closes at 1:45PM Nov 27, reopens at 5PM Nov 29, 2026', () => {
      expectClosesAt('STATIC_NYMEX', new TZDate(2026, 10, 27, 13, 45, 0, 0, TZ))
      expectOpensAt('STATIC_NYMEX', new TZDate(2026, 10, 29, 17, 0, 0, 0, TZ))
    })

    it('Christmas: closes at 12:45PM Dec 24, reopens at 5PM Dec 27, 2026', () => {
      expectClosesAt('STATIC_NYMEX', new TZDate(2026, 11, 24, 12, 45, 0, 0, TZ))
      expectOpensAt('STATIC_NYMEX', new TZDate(2026, 11, 27, 17, 0, 0, 0, TZ))
    })

    it('New Year: closes at 4PM Dec 31 2026, reopens at 5PM Jan 3, 2027', () => {
      expectClosesAt('STATIC_NYMEX', new TZDate(2026, 11, 31, 16, 0, 0, 0, TZ))
      expectOpensAt('STATIC_NYMEX', new TZDate(2027, 0, 3, 17, 0, 0, 0, TZ))
    })
  })

  describe('weekend (Friday 4PM - Sunday 5PM CT)', () => {
    it('closes at Friday 4PM CT (Jan 16, 2026)', () => {
      expectClosesAt('STATIC_NYMEX', new TZDate(2026, 0, 16, 16, 0, 0, 0, TZ))
    })

    it('reopens at Sunday 5PM CT (Jan 18, 2026)', () => {
      expectOpensAt('STATIC_NYMEX', new TZDate(2026, 0, 18, 17, 0, 0, 0, TZ))
    })
  })

  describe('daily maintenance (4PM - 5PM CT)', () => {
    it('closes at 4PM and reopens at 5PM CT on a weekday (Jan 12, 2026)', () => {
      expectClosesAt('STATIC_NYMEX', new TZDate(2026, 0, 12, 16, 0, 0, 0, TZ))
      expectOpensAt('STATIC_NYMEX', new TZDate(2026, 0, 12, 17, 0, 0, 0, TZ))
    })
  })

  describe('open', () => {
    it('is open at 10AM CT on a weekday (Jan 12, 2026)', () => {
      jest.setSystemTime(new TZDate(2026, 0, 12, 10, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_NYMEX').marketStatus).toEqual(MarketStatus.OPEN)
    })

    it('is open at 2PM CT on a weekday (Jan 12, 2026)', () => {
      jest.setSystemTime(new TZDate(2026, 0, 12, 14, 0, 0, 0, TZ).getTime())
      expect(getStatusFromStaticSchedule('STATIC_NYMEX').marketStatus).toEqual(MarketStatus.OPEN)
    })
  })
})
