import {
  convertToTimestampMs,
  getPreviousNonWeekendDay,
  getStartingAndEndingDates,
  isAfterTime,
  isBeforeTime,
  isInTimeRange,
  toTimezoneDate,
} from '../../src/transport/utils'

describe('timeFunctions', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  describe('toTimezoneDate', () => {
    it('should format date to the given timezone', () => {
      const date = '2024-05-24T14:00:00Z' // 2 PM UTC
      const timezone = 'America/New_York'
      const formattedDate = '2024-05-24 10:00:00' // 10 AM ET

      const result = toTimezoneDate(date, timezone)
      expect(result).toBe(formattedDate)
    })
  })

  describe('isBeforeTime', () => {
    it('should return true if current time is before the end time in the given timezone', () => {
      const mockToday = new Date('2024-05-24T13:20:00.000Z') // 13:20 UTC
      jest.useFakeTimers()
      jest.setSystemTime(mockToday)
      const endTimeS = '10:30:00' // Target
      const timezone = 'America/New_York'

      // 13:20 UTC converts to 09:20 AM ET
      const result = isBeforeTime(endTimeS, timezone)
      expect(result).toBe(true)
    })

    it('should return false if current time is after the end time in the given timezone', () => {
      const mockToday = new Date('2024-05-24T15:20:00.000Z') // 15:20 UTC
      jest.useFakeTimers()
      jest.setSystemTime(mockToday)
      const endTimeS = '10:30:00' // Target
      const timezone = 'America/New_York'

      // 15:20 UTC converts to 11:20 AM ET
      const result = isBeforeTime(endTimeS, timezone)
      expect(result).toBe(false)
    })
  })

  describe('isAfterTime', () => {
    it('should return true if current time is after the start time in the given timezone', () => {
      const mockToday = new Date('2024-05-24T15:20:00.000Z') // 15:20 UTC
      jest.useFakeTimers()
      jest.setSystemTime(mockToday)
      const startTimeS = '10:30:00' // Target
      const timezone = 'America/New_York'

      // 15:20 UTC converts to 11:20 AM ET
      const result = isAfterTime(startTimeS, timezone)
      expect(result).toBe(true)
    })

    it('should return false if current time is before the start time in the given timezone', () => {
      const mockToday = new Date('2024-05-24T13:20:00.000Z') // 13:20  UTC
      jest.useFakeTimers()
      jest.setSystemTime(mockToday)
      const startTimeS = '10:30:00' // Target
      const timezone = 'America/New_York'

      // 13:20 UTC converts to 09:20 AM ET
      const result = isAfterTime(startTimeS, timezone)
      expect(result).toBe(false)
    })
  })

  describe('isInTimeRange', () => {
    it('should return true if current time is within the time range in the given timezone', () => {
      const mockToday = new Date('2024-05-24T13:40:00.000Z') // 13:40 UTC
      jest.useFakeTimers()
      jest.setSystemTime(mockToday)
      const timezone = 'America/New_York'

      // 13:40 UTC converts to 9:40 AM ET
      const result = isInTimeRange('09:09:00', '10:30:00', timezone)
      expect(result).toBe(true)
    })

    it('should return false if current time is not within the time range in the given timezone', () => {
      const mockToday = new Date('2024-05-24T15:20:00.000Z') // 15:20 UTC
      jest.useFakeTimers()
      jest.setSystemTime(mockToday)
      const timezone = 'America/New_York'

      // 15:20 UTC converts to 11:20 AM ET
      const result = isInTimeRange('09:09:00', '10:30:00', timezone)
      expect(result).toBe(false)
    })
  })

  describe('getStartingAndEndingDates', () => {
    it('should return dates with defaults', () => {
      const mockToday = new Date('2001-01-01T11:11:11.111Z')
      jest.useFakeTimers()
      jest.setSystemTime(mockToday)
      const { startDate, endDate } = getStartingAndEndingDates()
      expect(endDate).toBe('2001-01-01')
      expect(startDate).toBe('2000-12-26')
    })

    it('should return dates with provided reference date', () => {
      const mockDate = new Date('2001-04-24T11:11:11.111Z')
      const { startDate, endDate } = getStartingAndEndingDates(undefined, mockDate)
      expect(endDate).toBe('2001-04-24')
      expect(startDate).toBe('2001-04-18')
    })

    it('should return dates with provided time window', () => {
      const mockDate = new Date('2001-01-01T11:11:11.111Z')
      const { startDate, endDate } = getStartingAndEndingDates(34, mockDate)
      expect(endDate).toBe('2001-01-01')
      expect(startDate).toBe('2000-11-29')
    })
  })

  describe('getPreviousNonWeekendDay', () => {
    it('should return the previous day formatted as MM/dd/yyyy', () => {
      const mockToday = new Date('2024-05-24T15:20:00.000Z')
      jest.useFakeTimers()
      jest.setSystemTime(mockToday)
      const timezone = 'America/New_York'
      const pnwd = getPreviousNonWeekendDay(timezone)
      expect(pnwd).toBe('05/23/2024')
    })

    it('should return Friday when current day is Monday', () => {
      const mockToday = new Date('2024-05-20T15:20:00.000Z') // Monday
      jest.useFakeTimers()
      jest.setSystemTime(mockToday)
      const timezone = 'America/New_York'
      const pnwd = getPreviousNonWeekendDay(timezone)
      expect(pnwd).toBe('05/17/2024') // Friday
    })

    it('should return Friday when current day is Sunday', () => {
      const mockToday = new Date('2024-05-19T15:19:00.000Z') // Sunday
      jest.useFakeTimers()
      jest.setSystemTime(mockToday)
      const timezone = 'America/New_York'
      const pnwd = getPreviousNonWeekendDay(timezone)
      expect(pnwd).toBe('05/17/2024') // Friday
    })

    it('should return Friday when current day is Saturday', () => {
      const mockToday = new Date('2024-05-18T15:19:00.000Z') // Saturday
      jest.useFakeTimers()
      jest.setSystemTime(mockToday)
      const timezone = 'America/New_York'
      const pnwd = getPreviousNonWeekendDay(timezone)
      expect(pnwd).toBe('05/17/2024') // Friday
    })
  })

  describe('convertToTimestampMs', () => {
    it('should convert MM/DD/YYYY date string to Unix timestamp in milliseconds', () => {
      const dateString = '01/23/2024'
      const result = convertToTimestampMs(dateString)
      // January 23, 2024 at 00:00:00 UTC
      expect(result).toBe(1705968000000)
    })

    it('should handle single digit month and day', () => {
      const dateString = '5/3/2024'
      const result = convertToTimestampMs(dateString)
      // May 3, 2024 at 00:00:00 UTC
      expect(result).toBe(1714694400000)
    })

    it('should handle end of year date', () => {
      const dateString = '12/31/2024'
      const result = convertToTimestampMs(dateString)
      // December 31, 2024 at 00:00:00 UTC
      expect(result).toBe(1735603200000)
    })

    it('should handle start of year date', () => {
      const dateString = '01/01/2025'
      const result = convertToTimestampMs(dateString)
      // January 1, 2025 at 00:00:00 UTC
      expect(result).toBe(1735689600000)
    })

    it('should handle leap year date', () => {
      const dateString = '02/29/2024'
      const result = convertToTimestampMs(dateString)
      // February 29, 2024 at 00:00:00 UTC (2024 is a leap year)
      expect(result).toBe(1709164800000)
    })

    it('should return timestamp at midnight UTC', () => {
      const dateString = '06/15/2024'
      const result = convertToTimestampMs(dateString)
      const date = new Date(result)

      expect(date.getUTCHours()).toBe(0)
      expect(date.getUTCMinutes()).toBe(0)
      expect(date.getUTCSeconds()).toBe(0)
      expect(date.getUTCMilliseconds()).toBe(0)
    })
  })
})
