import {
  MarketStatus,
  TwentyfourFiveMarketStatus,
} from '@chainlink/external-adapter-framework/adapter'
import { TZDate, tz } from '@date-fns/tz'
import { parseISO } from 'date-fns'
import {
  Schedule,
  getScheduleValidationError,
  getStatusStringFromSchedule,
} from '../../src/util/schedule'

describe('schedule', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  describe('getStatusStringFromSchedule', () => {
    describe('for NYSE 24/5 schedule', () => {
      const TZ = 'America/New_York'
      const scheduleData: Schedule<typeof TwentyfourFiveMarketStatus> = {
        timezone: 'America/New_York',
        lastValidDate: '2027-01-03',
        weekly: [
          {
            status: 'WEEKEND',
            when: [
              { days: ['FRIDAY'], times: [{ start: '20:00:00', end: '24:00:00' }] },
              { days: ['SATURDAY'], times: [{ start: '00:00:00', end: '24:00:00' }] },
              { days: ['SUNDAY'], times: [{ start: '00:00:00', end: '20:00:00' }] },
            ],
          },
          {
            status: 'PRE_MARKET',
            when: [
              {
                days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
                times: [{ start: '04:00:00', end: '09:30:00' }],
              },
            ],
          },
          {
            status: 'REGULAR',
            when: [
              {
                days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
                times: [{ start: '09:30:00', end: '16:00:00' }],
              },
            ],
          },
          {
            status: 'POST_MARKET',
            when: [
              {
                days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
                times: [{ start: '16:00:00', end: '20:00:00' }],
              },
            ],
          },
          {
            status: 'OVERNIGHT',
            when: [
              {
                days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'],
                times: [
                  { start: '00:00:00', end: '04:00:00' },
                  { start: '20:00:00', end: '24:00:00' },
                ],
              },
              { days: ['FRIDAY'], times: [{ start: '00:00:00', end: '04:00:00' }] },
              { days: ['SUNDAY'], times: [{ start: '20:00:00', end: '24:00:00' }] },
            ],
          },
        ],
        exceptions: [
          { status: 'WEEKEND', start: '2026-01-18 20:00:00', end: '2026-01-19 20:00:00' },
          { status: 'WEEKEND', start: '2026-02-15 20:00:00', end: '2026-02-16 20:00:00' },
          { status: 'WEEKEND', start: '2026-04-02 20:00:00', end: '2026-04-03 20:00:00' },
          { status: 'WEEKEND', start: '2026-05-24 20:00:00', end: '2026-05-25 20:00:00' },
          { status: 'WEEKEND', start: '2026-06-18 20:00:00', end: '2026-06-19 20:00:00' },
          { status: 'WEEKEND', start: '2026-07-02 20:00:00', end: '2026-07-03 20:00:00' },
          { status: 'WEEKEND', start: '2026-09-06 20:00:00', end: '2026-09-07 20:00:00' },
          { status: 'WEEKEND', start: '2026-11-25 20:00:00', end: '2026-11-26 20:00:00' },
          { status: 'POST_MARKET', start: '2026-11-27 13:00:00', end: '2026-11-27 17:00:00' },
          { status: 'WEEKEND', start: '2026-11-27 17:00:00', end: '2026-11-27 20:00:00' },
          { status: 'POST_MARKET', start: '2026-12-24 13:00:00', end: '2026-12-24 17:00:00' },
          { status: 'WEEKEND', start: '2026-12-24 17:00:00', end: '2026-12-25 20:00:00' },
          { status: 'WEEKEND', start: '2026-12-31 20:00:00', end: '2027-01-01 20:00:00' },
        ],
      }

      describe('validate schedule', () => {
        it('should consider the schedule valid', () => {
          expect(
            getScheduleValidationError(JSON.stringify(scheduleData), TwentyfourFiveMarketStatus),
          ).toBe(undefined)
        })
      })

      describe('holidays', () => {
        describe('full day holidays', () => {
          it('returns WEEKEND status for Martin Luther King Jr. Day (Jan 19, 2026)', () => {
            expect(
              getStatusStringFromSchedule(
                new TZDate(2026, 0, 19, 12, 0, 0, 0, TZ).getTime(),
                scheduleData,
              ),
            ).toBe('WEEKEND')
          })

          it('returns WEEKEND status for Presidents Day (Feb 16, 2026)', () => {
            expect(
              getStatusStringFromSchedule(
                new TZDate(2026, 1, 16, 10, 0, 0, 0, TZ).getTime(),
                scheduleData,
              ),
            ).toBe('WEEKEND')
          })

          it('returns WEEKEND status for Good Friday (Apr 3, 2026)', () => {
            expect(
              getStatusStringFromSchedule(
                new TZDate(2026, 3, 3, 10, 0, 0, 0, TZ).getTime(),
                scheduleData,
              ),
            ).toBe('WEEKEND')
          })

          it('returns WEEKEND status for New Year holiday (Dec 31, 2026 8PM - Jan 1, 2027 8PM ET)', () => {
            expect(
              getStatusStringFromSchedule(
                new TZDate(2027, 0, 1, 10, 0, 0, 0, TZ).getTime(),
                scheduleData,
              ),
            ).toBe('WEEKEND')
          })
        })

        describe('early close holidays', () => {
          it('returns POST_MARKET status for Thanksgiving early close (Nov 27, 2026 1PM-5PM ET)', () => {
            expect(
              getStatusStringFromSchedule(
                new TZDate(2026, 10, 27, 15, 0, 0, 0, TZ).getTime(),
                scheduleData,
              ),
            ).toBe('POST_MARKET')
          })

          it('returns WEEKEND status for Thanksgiving after early close (Nov 27, 2026 5PM-8PM ET)', () => {
            expect(
              getStatusStringFromSchedule(
                new TZDate(2026, 10, 27, 18, 0, 0, 0, TZ).getTime(),
                scheduleData,
              ),
            ).toBe('WEEKEND')
          })

          it('returns POST_MARKET status for Christmas Eve early close (Dec 24, 2026 1PM-5PM ET)', () => {
            expect(
              getStatusStringFromSchedule(
                new TZDate(2026, 11, 24, 14, 30, 0, 0, TZ).getTime(),
                scheduleData,
              ),
            ).toBe('POST_MARKET')
          })
        })
      })

      describe('weekday', () => {
        describe('OVERNIGHT', () => {
          it('returns OVERNIGHT status before 4:00 AM ET', () => {
            expect(
              getStatusStringFromSchedule(
                new TZDate(2026, 0, 15, 2, 30, 0, 0, TZ).getTime(),
                scheduleData,
              ),
            ).toBe('OVERNIGHT')
          })

          it('returns OVERNIGHT status at 3:59 AM ET', () => {
            expect(
              getStatusStringFromSchedule(
                new TZDate(2026, 0, 15, 3, 59, 0, 0, TZ).getTime(),
                scheduleData,
              ),
            ).toBe('OVERNIGHT')
          })

          it('returns OVERNIGHT status at 8:00 PM ET', () => {
            expect(
              getStatusStringFromSchedule(
                new TZDate(2026, 0, 15, 20, 0, 0, 0, TZ).getTime(),
                scheduleData,
              ),
            ).toBe('OVERNIGHT')
          })

          it('returns OVERNIGHT status at 11:59 PM ET', () => {
            expect(
              getStatusStringFromSchedule(
                new TZDate(2026, 0, 15, 23, 59, 0, 0, TZ).getTime(),
                scheduleData,
              ),
            ).toBe('OVERNIGHT')
          })
        })

        describe('PRE_MARKET', () => {
          it('returns PRE_MARKET status at 4:00 AM ET', () => {
            expect(
              getStatusStringFromSchedule(
                new TZDate(2026, 0, 15, 4, 0, 0, 0, TZ).getTime(),
                scheduleData,
              ),
            ).toBe('PRE_MARKET')
          })

          it('returns PRE_MARKET status at 9:29 AM ET', () => {
            expect(
              getStatusStringFromSchedule(
                new TZDate(2026, 0, 15, 9, 29, 0, 0, TZ).getTime(),
                scheduleData,
              ),
            ).toBe('PRE_MARKET')
          })
        })

        describe('REGULAR', () => {
          it('returns REGULAR status at 9:30 AM ET', () => {
            expect(
              getStatusStringFromSchedule(
                new TZDate(2026, 0, 15, 9, 30, 0, 0, TZ).getTime(),
                scheduleData,
              ),
            ).toBe('REGULAR')
          })

          it('returns REGULAR status at 12:00 PM ET', () => {
            expect(
              getStatusStringFromSchedule(
                new TZDate(2026, 0, 15, 12, 0, 0, 0, TZ).getTime(),
                scheduleData,
              ),
            ).toBe('REGULAR')
          })

          it('returns REGULAR status at 3:59 PM ET', () => {
            expect(
              getStatusStringFromSchedule(
                new TZDate(2026, 0, 15, 15, 59, 0, 0, TZ).getTime(),
                scheduleData,
              ),
            ).toBe('REGULAR')
          })
        })

        describe('POST_MARKET', () => {
          it('returns POST_MARKET status at 4:00 PM ET', () => {
            expect(
              getStatusStringFromSchedule(
                new TZDate(2026, 0, 15, 16, 0, 0, 0, TZ).getTime(),
                scheduleData,
              ),
            ).toBe('POST_MARKET')
          })

          it('returns POST_MARKET status at 7:59 PM ET', () => {
            expect(
              getStatusStringFromSchedule(
                new TZDate(2026, 0, 15, 19, 59, 0, 0, TZ).getTime(),
                scheduleData,
              ),
            ).toBe('POST_MARKET')
          })
        })
      })

      describe('weekend', () => {
        it('returns WEEKEND status when current time is within weekend range', () => {
          expect(
            getStatusStringFromSchedule(
              new TZDate(2026, 0, 17, 12, 0, 0, 0, TZ).getTime(),
              scheduleData,
            ),
          ).toBe('WEEKEND')
        })

        it('returns WEEKEND status even during regular market hours if weekend', () => {
          expect(
            getStatusStringFromSchedule(
              new TZDate(2026, 0, 17, 12, 0, 0, 0, TZ).getTime(),
              scheduleData,
            ),
          ).toBe('WEEKEND')
        })

        it('returns WEEKEND status on Friday evening within weekend range', () => {
          expect(
            getStatusStringFromSchedule(
              new TZDate(2026, 0, 16, 20, 0, 0, 0, TZ).getTime(),
              scheduleData,
            ),
          ).toBe('WEEKEND')
        })
      })
    })

    describe('for NYMEX schedule', () => {
      const TZ = 'US/Central'
      const scheduleData: Schedule<typeof MarketStatus> = {
        timezone: 'US/Central',
        lastValidDate: '2027-01-03',
        defaultStatus: 'OPEN',
        weekly: [
          {
            status: 'CLOSED',
            when: [
              {
                days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'],
                times: [{ start: '16:00:00', end: '17:00:00' }],
              },
              { days: ['FRIDAY'], times: [{ start: '16:00:00', end: '24:00:00' }] },
              { days: ['SATURDAY'], times: [{ start: '00:00:00', end: '24:00:00' }] },
              { days: ['SUNDAY'], times: [{ start: '00:00:00', end: '17:00:00' }] },
            ],
          },
        ],
        exceptions: [
          { status: 'CLOSED', start: '2026-05-25 13:30:00', end: '2026-05-25 17:00:00' },
          { status: 'CLOSED', start: '2026-06-19 12:00:00', end: '2026-06-21 17:00:00' },
          { status: 'CLOSED', start: '2026-07-03 12:00:00', end: '2026-07-05 17:00:00' },
          { status: 'CLOSED', start: '2026-09-07 13:30:00', end: '2026-09-07 17:00:00' },
          { status: 'CLOSED', start: '2026-11-26 13:30:00', end: '2026-11-26 17:00:00' },
          { status: 'CLOSED', start: '2026-11-27 13:45:00', end: '2026-11-29 17:00:00' },
          { status: 'CLOSED', start: '2026-12-24 12:45:00', end: '2026-12-27 17:00:00' },
          { status: 'CLOSED', start: '2026-12-31 16:00:00', end: '2027-01-03 17:00:00' },
        ],
      }

      const ONE_MINUTE = 60_000

      const expectClosesAt = (closeTime: TZDate) => {
        const time = closeTime.getTime()
        expect(getStatusStringFromSchedule(time - ONE_MINUTE, scheduleData)).toBe('OPEN')
        expect(getStatusStringFromSchedule(time, scheduleData)).toBe('CLOSED')
        expect(getStatusStringFromSchedule(time + ONE_MINUTE, scheduleData)).toBe('CLOSED')
      }

      const expectOpensAt = (openTime: TZDate) => {
        const time = openTime.getTime()
        expect(getStatusStringFromSchedule(time - ONE_MINUTE, scheduleData)).toBe('CLOSED')
        expect(getStatusStringFromSchedule(time, scheduleData)).toBe('OPEN')
        expect(getStatusStringFromSchedule(time + ONE_MINUTE, scheduleData)).toBe('OPEN')
      }

      describe('holidays', () => {
        it('Memorial Day early close: closes at 1:30PM CT, reopens at 5PM CT (May 25, 2026)', () => {
          expectClosesAt(new TZDate(2026, 4, 25, 13, 30, 0, 0, TZ))
          expectOpensAt(new TZDate(2026, 4, 25, 17, 0, 0, 0, TZ))
        })

        it('Juneteenth: closes at 12PM Jun 19, reopens at 5PM Jun 21, 2026', () => {
          expectClosesAt(new TZDate(2026, 5, 19, 12, 0, 0, 0, TZ))
          expectOpensAt(new TZDate(2026, 5, 21, 17, 0, 0, 0, TZ))
        })

        it('Independence Day: closes at 12PM Jul 3, reopens at 5PM Jul 5, 2026', () => {
          expectClosesAt(new TZDate(2026, 6, 3, 12, 0, 0, 0, TZ))
          expectOpensAt(new TZDate(2026, 6, 5, 17, 0, 0, 0, TZ))
        })

        it('Labor Day early close: closes at 1:30PM CT, reopens at 5PM CT (Sep 7, 2026)', () => {
          expectClosesAt(new TZDate(2026, 8, 7, 13, 30, 0, 0, TZ))
          expectOpensAt(new TZDate(2026, 8, 7, 17, 0, 0, 0, TZ))
        })

        it('Thanksgiving early close: closes at 1:30PM CT, reopens at 5PM CT (Nov 26, 2026)', () => {
          expectClosesAt(new TZDate(2026, 10, 26, 13, 30, 0, 0, TZ))
          expectOpensAt(new TZDate(2026, 10, 26, 17, 0, 0, 0, TZ))
        })

        it('Day after Thanksgiving: closes at 1:45PM Nov 27, reopens at 5PM Nov 29, 2026', () => {
          expectClosesAt(new TZDate(2026, 10, 27, 13, 45, 0, 0, TZ))
          expectOpensAt(new TZDate(2026, 10, 29, 17, 0, 0, 0, TZ))
        })

        it('Christmas: closes at 12:45PM Dec 24, reopens at 5PM Dec 27, 2026', () => {
          expectClosesAt(new TZDate(2026, 11, 24, 12, 45, 0, 0, TZ))
          expectOpensAt(new TZDate(2026, 11, 27, 17, 0, 0, 0, TZ))
        })

        it('New Year: closes at 4PM Dec 31 2026, reopens at 5PM Jan 3, 2027', () => {
          expectClosesAt(new TZDate(2026, 11, 31, 16, 0, 0, 0, TZ))
          expectOpensAt(new TZDate(2027, 0, 3, 17, 0, 0, 0, TZ))
        })
      })

      describe('weekend (Friday 4PM - Sunday 5PM CT)', () => {
        it('closes at Friday 4PM CT (Jan 16, 2026)', () => {
          expectClosesAt(new TZDate(2026, 0, 16, 16, 0, 0, 0, TZ))
        })

        it('reopens at Sunday 5PM CT (Jan 18, 2026)', () => {
          expectOpensAt(new TZDate(2026, 0, 18, 17, 0, 0, 0, TZ))
        })
      })

      describe('daily maintenance (4PM - 5PM CT)', () => {
        it('closes at 4PM and reopens at 5PM CT on a weekday (Jan 12, 2026)', () => {
          expectClosesAt(new TZDate(2026, 0, 12, 16, 0, 0, 0, TZ))
          expectOpensAt(new TZDate(2026, 0, 12, 17, 0, 0, 0, TZ))
        })
      })

      describe('open', () => {
        it('is open at 10AM CT on a weekday (Jan 12, 2026)', () => {
          expect(
            getStatusStringFromSchedule(
              new TZDate(2026, 0, 12, 10, 0, 0, 0, TZ).getTime(),
              scheduleData,
            ),
          ).toBe('OPEN')
        })

        it('is open at 2PM CT on a weekday (Jan 12, 2026)', () => {
          expect(
            getStatusStringFromSchedule(
              new TZDate(2026, 0, 12, 14, 0, 0, 0, TZ).getTime(),
              scheduleData,
            ),
          ).toBe('OPEN')
        })
      })
    })
  })

  describe('getScheduleValidationError', () => {
    const validMarketStatusSchedule = JSON.stringify({
      timezone: 'America/New_York',
      lastValidDate: '2027-01-03',
      defaultStatus: 'CLOSED',
      weekly: [],
      exceptions: [],
    })
    const validTwentyfourFiveMarketStatusSchedule = JSON.stringify({
      timezone: 'America/New_York',
      lastValidDate: '2027-01-03',
      defaultStatus: 'WEEKEND',
      weekly: [],
      exceptions: [],
    })

    it('should return undefined for a valid MarketStatus schedule', () => {
      expect(getScheduleValidationError(validMarketStatusSchedule, MarketStatus)).toBe(undefined)
    })

    it('should return undefined for a valid TwentyfourFiveMarketStatus schedule', () => {
      expect(
        getScheduleValidationError(
          validTwentyfourFiveMarketStatusSchedule,
          TwentyfourFiveMarketStatus,
        ),
      ).toBe(undefined)
    })

    it('should return an error for a an empty schedule string', () => {
      expect(getScheduleValidationError('', MarketStatus)).toBe('Unexpected end of JSON input')
    })

    it('should return an error for invalid JSON', () => {
      expect(getScheduleValidationError('{"weekly":', MarketStatus)).toBe(
        'Unexpected end of JSON input',
      )
    })

    it('should return an error when "timezone" field is missing', () => {
      const schedule = JSON.parse(validMarketStatusSchedule)
      delete schedule.timezone
      expect(getScheduleValidationError(JSON.stringify(schedule), MarketStatus)).toBe(
        `Invalid timezone: 'undefined'`,
      )
    })

    it('should return an error when "lastValidDate" format is invalid', () => {
      const invalidDate = '20270103'
      const schedule = JSON.parse(validMarketStatusSchedule)
      schedule.lastValidDate = invalidDate
      expect(getScheduleValidationError(JSON.stringify(schedule), MarketStatus)).toBe(
        `lastValidDate must have format 'yyyy-MM-dd'. Found: '${invalidDate}'`,
      )
    })

    it('should not return an error when "lastValidDate" is today', () => {
      const lastValidDate = '2026-08-18'
      const schedule = JSON.parse(validMarketStatusSchedule)
      schedule.lastValidDate = lastValidDate
      jest.setSystemTime(parseISO('2026-08-18 23:59:59', { in: tz(schedule.timezone) }).getTime())
      expect(getScheduleValidationError(JSON.stringify(schedule), MarketStatus)).toBe(undefined)
    })

    it('should return an error when "lastValidDate" is in the past', () => {
      const lastValidDate = '2026-08-18'
      const schedule = JSON.parse(validMarketStatusSchedule)
      schedule.lastValidDate = lastValidDate
      jest.setSystemTime(parseISO('2026-08-19 00:00:00', { in: tz(schedule.timezone) }).getTime())
      expect(getScheduleValidationError(JSON.stringify(schedule), MarketStatus)).toBe(
        `Last valid date '${lastValidDate}' should not be in the past.`,
      )
    })

    it('should return an error when "weekly" field is missing', () => {
      const schedule = JSON.parse(validMarketStatusSchedule)
      delete schedule.weekly
      expect(getScheduleValidationError(JSON.stringify(schedule), MarketStatus)).toBe(
        'scheduleData.weekly is not iterable',
      )
    })

    it('should return an error when "exceptions" field is missing', () => {
      const schedule = JSON.parse(validMarketStatusSchedule)
      delete schedule.exceptions
      expect(getScheduleValidationError(JSON.stringify(schedule), MarketStatus)).toBe(
        'scheduleData.exceptions is not iterable',
      )
    })

    it('should return an error when defaultStatus is invalid MarketStatus', () => {
      const schedule = JSON.parse(validMarketStatusSchedule)
      schedule.defaultStatus = 'WEEKEND'
      expect(getScheduleValidationError(JSON.stringify(schedule), MarketStatus)).toBe(
        "Status should be one of 'UNKNOWN', 'CLOSED', 'OPEN'. Found: 'WEEKEND'",
      )
    })

    it('should return an error when weekly status is invalid MarketStatus', () => {
      const schedule = JSON.parse(validMarketStatusSchedule)
      schedule.weekly.push({
        status: 'WEEKEND',
        when: [
          {
            days: ['MONDAY'],
            times: [{ start: '09:30:00', end: '16:00:00' }],
          },
        ],
      })
      expect(getScheduleValidationError(JSON.stringify(schedule), MarketStatus)).toBe(
        "Status should be one of 'UNKNOWN', 'CLOSED', 'OPEN'. Found: 'WEEKEND'",
      )
    })

    it('should return an error when exceptions status is invalid MarketStatus', () => {
      const schedule = JSON.parse(validMarketStatusSchedule)
      schedule.exceptions.push({
        status: 'WEEKEND',
        start: '2026-01-01 09:30:00',
        end: '2026-01-01 16:00:00',
      })
      expect(getScheduleValidationError(JSON.stringify(schedule), MarketStatus)).toBe(
        "Status should be one of 'UNKNOWN', 'CLOSED', 'OPEN'. Found: 'WEEKEND'",
      )
    })

    it('should return an error when defaultStatus is invalid TwentyfourFiveMarketStatus', () => {
      const schedule = JSON.parse(validMarketStatusSchedule)
      schedule.defaultStatus = 'OPEN'
      expect(getScheduleValidationError(JSON.stringify(schedule), TwentyfourFiveMarketStatus)).toBe(
        "Status should be one of 'UNKNOWN', 'PRE_MARKET', 'REGULAR', 'POST_MARKET', 'OVERNIGHT', 'WEEKEND'. Found: 'OPEN'",
      )
    })

    it('should return an error when weekly status is invalid TwentyfourFiveMarketStatus', () => {
      const schedule = JSON.parse(validTwentyfourFiveMarketStatusSchedule)
      schedule.weekly.push({
        status: 'OPEN',
        when: [
          {
            days: ['MONDAY'],
            times: [{ start: '09:30:00', end: '16:00:00' }],
          },
        ],
      })
      expect(getScheduleValidationError(JSON.stringify(schedule), TwentyfourFiveMarketStatus)).toBe(
        "Status should be one of 'UNKNOWN', 'PRE_MARKET', 'REGULAR', 'POST_MARKET', 'OVERNIGHT', 'WEEKEND'. Found: 'OPEN'",
      )
    })

    it('should return an error when exceptions status is invalid TwentyfourFiveMarketStatus', () => {
      const schedule = JSON.parse(validMarketStatusSchedule)
      schedule.exceptions.push({
        status: 'CLOSED',
        start: '2026-01-01 09:30:00',
        end: '2026-01-01 16:00:00',
      })
      expect(getScheduleValidationError(JSON.stringify(schedule), TwentyfourFiveMarketStatus)).toBe(
        "Status should be one of 'UNKNOWN', 'PRE_MARKET', 'REGULAR', 'POST_MARKET', 'OVERNIGHT', 'WEEKEND'. Found: 'CLOSED'",
      )
    })

    it('should return an error when weekly schedule contains an invalid week day', () => {
      const schedule = JSON.parse(validMarketStatusSchedule)
      schedule.weekly.push({
        status: 'OPEN',
        when: [
          {
            days: ['MARSDAY'],
            times: [
              {
                start: '09:30:00',
                end: '16:00:00',
              },
            ],
          },
        ],
      })
      expect(getScheduleValidationError(JSON.stringify(schedule), MarketStatus)).toBe(
        "Invalid weekday 'MARSDAY' found in weekly schedule.",
      )
    })

    it('should return an error when weekly schedule contains an invalid time', () => {
      const schedule = JSON.parse(validMarketStatusSchedule)
      schedule.weekly.push({
        status: 'OPEN',
        when: [
          {
            days: ['MONDAY'],
            times: [
              {
                start: '9:30:00',
                end: '16:00:00',
              },
            ],
          },
        ],
      })
      expect(getScheduleValidationError(JSON.stringify(schedule), MarketStatus)).toBe(
        "Invalid time format: '9:30:00'. Expected format is 'HH:mm:ss'",
      )
    })

    it('should return an error when weekly schedule contains duplicate status', () => {
      const schedule = JSON.parse(validMarketStatusSchedule)
      schedule.weekly.push(
        {
          status: 'OPEN',
          when: [
            {
              days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
              start: '09:30:00',
              end: '16:00:00',
            },
          ],
        },
        {
          status: 'OPEN',
          when: [
            {
              days: ['SATURDAY', 'SUNDAY'],
              start: '12:30:00',
              end: '14:00:00',
            },
          ],
        },
      )
      expect(getScheduleValidationError(JSON.stringify(schedule), MarketStatus)).toBe(
        "Duplicate status 'OPEN' found in weekly schedule.",
      )
    })

    it('should return an error when weekly schedule contains default status', () => {
      const schedule = JSON.parse(validMarketStatusSchedule)
      schedule.defaultStatus = 'CLOSED'
      schedule.weekly.push({
        status: 'CLOSED',
        when: [
          {
            days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
            start: '09:30:00',
            end: '16:00:00',
          },
        ],
      })
      expect(getScheduleValidationError(JSON.stringify(schedule), MarketStatus)).toBe(
        "Weekly schedule contains section with status 'CLOSED' which is also used as defaultStatus.",
      )
    })

    it('should return an error when weekly schedule contains duplicate days for the same status', () => {
      const schedule = JSON.parse(validMarketStatusSchedule)
      schedule.weekly.push({
        status: 'OPEN',
        when: [
          {
            days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
            times: [
              {
                start: '09:30:00',
                end: '16:00:00',
              },
            ],
          },
          {
            days: ['FRIDAY', 'SATURDAY', 'SUNDAY'],
            times: [
              {
                start: '09:30:00',
                end: '16:00:00',
              },
            ],
          },
        ],
      })
      expect(getScheduleValidationError(JSON.stringify(schedule), MarketStatus)).toBe(
        "Duplicate weekday 'FRIDAY' found in weekly schedule.",
      )
    })

    it('should not return an error when weekly schedule contains duplicate days for different statuses', () => {
      const schedule = JSON.parse(validTwentyfourFiveMarketStatusSchedule)
      schedule.weekly.push(
        {
          status: 'REGULAR',
          when: [
            {
              days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
              times: [
                {
                  start: '09:30:00',
                  end: '16:00:00',
                },
              ],
            },
          ],
        },
        {
          status: 'POST_MARKET',
          when: [
            {
              days: ['FRIDAY', 'SATURDAY', 'SUNDAY'],
              times: [
                {
                  start: '16:00:00',
                  end: '17:00:00',
                },
              ],
            },
          ],
        },
      )
      expect(getScheduleValidationError(JSON.stringify(schedule), TwentyfourFiveMarketStatus)).toBe(
        undefined,
      )
    })

    it('should return an error when weekly schedule contains overlapping time segments', () => {
      const schedule = JSON.parse(validTwentyfourFiveMarketStatusSchedule)
      schedule.weekly.push(
        {
          status: 'REGULAR',
          when: [
            {
              days: ['MONDAY'],
              times: [
                {
                  start: '09:30:00',
                  end: '16:00:00',
                },
              ],
            },
          ],
        },
        {
          status: 'POST_MARKET',
          when: [
            {
              days: ['MONDAY'],
              times: [
                {
                  start: '15:30:00',
                  end: '20:00:00',
                },
              ],
            },
          ],
        },
      )
      expect(getScheduleValidationError(JSON.stringify(schedule), TwentyfourFiveMarketStatus)).toBe(
        "Overlapping time segments found for 'MONDAY' in weekly schedule between '15:30:00' and '16:00:00'.",
      )
    })

    it('should return an error when weekly schedule does not cover all times and defaultStatus is missing', () => {
      const schedule = JSON.parse(validTwentyfourFiveMarketStatusSchedule)
      delete schedule.defaultStatus
      expect(getScheduleValidationError(JSON.stringify(schedule), TwentyfourFiveMarketStatus)).toBe(
        'defaultStatus should be set because weekly schedule does not cover 00:00:00 to 24:00:00 on MONDAY.',
      )
    })

    it('should return an error when weekly schedule does not cover 24:00:00 and defaultStatus is missing', () => {
      const schedule = JSON.parse(validTwentyfourFiveMarketStatusSchedule)
      delete schedule.defaultStatus
      schedule.weekly = [
        {
          status: 'REGULAR',
          when: [
            {
              days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
              times: [
                {
                  start: '00:00:00',
                  end: '23:59:59',
                },
              ],
            },
          ],
        },
      ]
      expect(getScheduleValidationError(JSON.stringify(schedule), TwentyfourFiveMarketStatus)).toBe(
        'defaultStatus should be set because weekly schedule does not cover 23:59:59 to 24:00:00 on MONDAY.',
      )
    })

    it('should return an error when weekly schedule covers all times and defaultStatus is set', () => {
      const schedule = JSON.parse(validTwentyfourFiveMarketStatusSchedule)
      schedule.defaultStatus = 'WEEKEND'
      schedule.weekly = [
        {
          status: 'REGULAR',
          when: [
            {
              days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
              times: [
                {
                  start: '00:00:00',
                  end: '24:00:00',
                },
              ],
            },
          ],
        },
      ]
      expect(getScheduleValidationError(JSON.stringify(schedule), TwentyfourFiveMarketStatus)).toBe(
        'Weekly schedule covers all times for all days so defaultStatus is unused.',
      )
    })

    it('should return an error when exceptions contain an invalid date time', () => {
      const schedule = JSON.parse(validMarketStatusSchedule)
      schedule.exceptions.push({
        status: 'CLOSED',
        start: '2026-01-01 9:30:00',
        end: '2026-01-01 9:30:00',
      })
      expect(getScheduleValidationError(JSON.stringify(schedule), MarketStatus)).toBe(
        "Invalid time format: '2026-01-01 9:30:00'. Expected format is 'yyyy-MM-dd HH:mm:ss'",
      )
    })

    it('should return an error when exceptions are not sorted', () => {
      const schedule = JSON.parse(validMarketStatusSchedule)
      schedule.exceptions.push(
        {
          status: 'CLOSED',
          start: '2026-01-02 09:30:00',
          end: '2026-01-02 16:00:00',
        },
        {
          status: 'CLOSED',
          start: '2026-01-01 09:30:00',
          end: '2026-01-01 16:00:00',
        },
      )
      expect(getScheduleValidationError(JSON.stringify(schedule), MarketStatus)).toBe(
        "Exceptions must be sorted by start time. Found exception with start time '2026-01-02 09:30:00' before '2026-01-01 09:30:00'.",
      )
    })

    it('should return an error when exceptions are overlapping', () => {
      const schedule = JSON.parse(validMarketStatusSchedule)
      schedule.exceptions.push(
        {
          status: 'CLOSED',
          start: '2026-01-01 09:30:00',
          end: '2026-01-01 16:00:00',
        },
        {
          status: 'CLOSED',
          start: '2026-01-01 15:30:00',
          end: '2026-01-01 20:00:00',
        },
      )
      expect(getScheduleValidationError(JSON.stringify(schedule), MarketStatus)).toBe(
        "Overlapping exceptions found in schedule between '2026-01-01 16:00:00' and '2026-01-01 15:30:00'.",
      )
    })

    it('should not return an error when exceptions are connecting', () => {
      const schedule = JSON.parse(validMarketStatusSchedule)
      schedule.exceptions.push(
        {
          status: 'CLOSED',
          start: '2026-01-01 09:30:00',
          end: '2026-01-01 16:00:00',
        },
        {
          status: 'OPEN',
          start: '2026-01-01 16:00:00',
          end: '2026-01-01 20:00:00',
        },
      )
      expect(getScheduleValidationError(JSON.stringify(schedule), MarketStatus)).toBe(undefined)
    })
  })
})
