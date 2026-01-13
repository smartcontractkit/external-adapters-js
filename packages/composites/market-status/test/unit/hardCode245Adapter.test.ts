import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { TZDate } from '@date-fns/tz'
import { getStatus } from '../../src/config/hardCode245Adapter'

describe('getStatus', () => {
  const WEEKEND = '520-020:America/New_York'

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('holidays', () => {
    describe('full day holidays', () => {
      it('returns WEEKEND status for Martin Luther King Jr. Day (Jan 19, 2026)', () => {
        jest.setSystemTime(new TZDate(2026, 0, 19, 12, 0, 0, 0, 'America/New_York').getTime())
        expect(getStatus(WEEKEND).marketStatus).toEqual(TwentyfourFiveMarketStatus.WEEKEND)
      })

      it('returns WEEKEND status for Presidents Day (Feb 16, 2026)', () => {
        jest.setSystemTime(new TZDate(2026, 1, 16, 10, 0, 0, 0, 'America/New_York').getTime())
        expect(getStatus(WEEKEND).marketStatus).toEqual(TwentyfourFiveMarketStatus.WEEKEND)
      })

      it('returns WEEKEND status for Good Friday (Apr 3, 2026)', () => {
        jest.setSystemTime(new TZDate(2026, 3, 3, 10, 0, 0, 0, 'America/New_York').getTime())
        expect(getStatus(WEEKEND).marketStatus).toEqual(TwentyfourFiveMarketStatus.WEEKEND)
      })

      it('returns WEEKEND status for New Year holiday (Dec 31, 2026 8PM - Jan 1, 2027 8PM ET)', () => {
        jest.setSystemTime(new TZDate(2027, 0, 1, 10, 0, 0, 0, 'America/New_York').getTime())
        expect(getStatus(WEEKEND).marketStatus).toEqual(TwentyfourFiveMarketStatus.WEEKEND)
      })
    })

    describe('early close holidays', () => {
      it('returns POST_MARKET status for Thanksgiving early close (Nov 27, 2026 1PM-5PM ET)', () => {
        jest.setSystemTime(new TZDate(2026, 10, 27, 15, 0, 0, 0, 'America/New_York').getTime())
        expect(getStatus(WEEKEND).marketStatus).toEqual(TwentyfourFiveMarketStatus.POST_MARKET)
      })

      it('returns WEEKEND status for Thanksgiving after early close (Nov 27, 2026 5PM-8PM ET)', () => {
        jest.setSystemTime(new TZDate(2026, 10, 27, 18, 0, 0, 0, 'America/New_York').getTime())
        expect(getStatus(WEEKEND).marketStatus).toEqual(TwentyfourFiveMarketStatus.WEEKEND)
      })

      it('returns POST_MARKET status for Christmas Eve early close (Dec 24, 2026 1PM-5PM ET)', () => {
        jest.setSystemTime(new TZDate(2026, 11, 24, 14, 30, 0, 0, 'America/New_York').getTime())
        expect(getStatus(WEEKEND).marketStatus).toEqual(TwentyfourFiveMarketStatus.POST_MARKET)
      })
    })
  })

  describe('weekday', () => {
    describe('OVERNIGHT', () => {
      it('returns OVERNIGHT status before 4:00 AM ET', () => {
        jest.setSystemTime(new TZDate(2026, 0, 15, 2, 30, 0, 0, 'America/New_York').getTime())
        expect(getStatus(WEEKEND).marketStatus).toEqual(TwentyfourFiveMarketStatus.OVERNIGHT)
      })

      it('returns OVERNIGHT status at 3:59 AM ET', () => {
        jest.setSystemTime(new TZDate(2026, 0, 15, 3, 59, 0, 0, 'America/New_York').getTime())
        expect(getStatus(WEEKEND).marketStatus).toEqual(TwentyfourFiveMarketStatus.OVERNIGHT)
      })

      it('returns OVERNIGHT status at 8:00 PM ET', () => {
        jest.setSystemTime(new TZDate(2026, 0, 15, 20, 0, 0, 0, 'America/New_York').getTime())
        expect(getStatus(WEEKEND).marketStatus).toEqual(TwentyfourFiveMarketStatus.OVERNIGHT)
      })

      it('returns OVERNIGHT status at 11:59 PM ET', () => {
        jest.setSystemTime(new TZDate(2026, 0, 15, 23, 59, 0, 0, 'America/New_York').getTime())
        expect(getStatus(WEEKEND).marketStatus).toEqual(TwentyfourFiveMarketStatus.OVERNIGHT)
      })
    })

    describe('PRE_MARKET', () => {
      it('returns PRE_MARKET status at 4:00 AM ET', () => {
        jest.setSystemTime(new TZDate(2026, 0, 15, 4, 0, 0, 0, 'America/New_York').getTime())
        expect(getStatus(WEEKEND).marketStatus).toEqual(TwentyfourFiveMarketStatus.PRE_MARKET)
      })

      it('returns PRE_MARKET status at 9:29 AM ET', () => {
        jest.setSystemTime(new TZDate(2026, 0, 15, 9, 29, 0, 0, 'America/New_York').getTime())
        expect(getStatus(WEEKEND).marketStatus).toEqual(TwentyfourFiveMarketStatus.PRE_MARKET)
      })
    })

    describe('REGULAR', () => {
      it('returns REGULAR status at 9:30 AM ET', () => {
        jest.setSystemTime(new TZDate(2026, 0, 15, 9, 30, 0, 0, 'America/New_York').getTime())
        expect(getStatus(WEEKEND).marketStatus).toEqual(TwentyfourFiveMarketStatus.REGULAR)
      })

      it('returns REGULAR status at 12:00 PM ET', () => {
        jest.setSystemTime(new TZDate(2026, 0, 15, 12, 0, 0, 0, 'America/New_York').getTime())
        expect(getStatus(WEEKEND).marketStatus).toEqual(TwentyfourFiveMarketStatus.REGULAR)
      })

      it('returns REGULAR status at 3:59 PM ET', () => {
        jest.setSystemTime(new TZDate(2026, 0, 15, 15, 59, 0, 0, 'America/New_York').getTime())
        expect(getStatus(WEEKEND).marketStatus).toEqual(TwentyfourFiveMarketStatus.REGULAR)
      })
    })

    describe('POST_MARKET', () => {
      it('returns POST_MARKET status at 4:00 PM ET', () => {
        jest.setSystemTime(new TZDate(2026, 0, 15, 16, 0, 0, 0, 'America/New_York').getTime())
        expect(getStatus(WEEKEND).marketStatus).toEqual(TwentyfourFiveMarketStatus.POST_MARKET)
      })

      it('returns POST_MARKET status at 7:59 PM ET', () => {
        jest.setSystemTime(new TZDate(2026, 0, 15, 19, 59, 0, 0, 'America/New_York').getTime())
        expect(getStatus(WEEKEND).marketStatus).toEqual(TwentyfourFiveMarketStatus.POST_MARKET)
      })
    })
  })

  describe('weekend', () => {
    it('returns WEEKEND status when current time is within weekend range', () => {
      jest.setSystemTime(new TZDate(2026, 0, 17, 12, 0, 0, 0, 'America/New_York').getTime())
      expect(getStatus(WEEKEND).marketStatus).toEqual(TwentyfourFiveMarketStatus.WEEKEND)
    })

    it('returns WEEKEND status even during regular market hours if weekend', () => {
      jest.setSystemTime(new TZDate(2026, 0, 17, 12, 0, 0, 0, 'America/New_York').getTime())
      expect(getStatus(WEEKEND).marketStatus).toEqual(TwentyfourFiveMarketStatus.WEEKEND)
    })

    it('returns WEEKEND status on Friday evening within weekend range', () => {
      jest.setSystemTime(new TZDate(2026, 0, 16, 20, 0, 0, 0, 'America/New_York').getTime())
      expect(getStatus(WEEKEND).marketStatus).toEqual(TwentyfourFiveMarketStatus.WEEKEND)
    })
  })
})
