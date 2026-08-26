import { tz } from '@date-fns/tz'
import * as fs from 'fs'
import {
  getDaysOfWeekFromScheduleRow,
  getExceptionsFromSessionDifference,
  maxDate,
  minDate,
  rowGet,
  ScheduleGenerator,
  Session,
} from '../../src/scripts/schedule_generator'

jest.mock('fs')

describe('Schedule Generator', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-21T14:00:00Z'))
  })

  describe('minDate', () => {
    const timezone = tz('UTC')

    it('should return the chronologically first of two dates', () => {
      const date1 = timezone(new Date('2026-01-15'))
      const date2 = timezone(new Date('2026-01-20'))
      const result = minDate(date1, date2)
      expect(result).toBe(date1)
    })

    it('should return the second date when it is earlier', () => {
      const date1 = timezone(new Date('2026-01-20'))
      const date2 = timezone(new Date('2026-01-15'))
      const result = minDate(date1, date2)
      expect(result).toBe(date2)
    })

    it('should return date2 when date1 is null', () => {
      const date2 = timezone(new Date('2026-01-15'))
      const result = minDate(null, date2)
      expect(result).toBe(date2)
    })

    it('should return date1 when date2 is null', () => {
      const date1 = timezone(new Date('2026-01-15'))
      const result = minDate(date1, null)
      expect(result).toBe(date1)
    })

    it('should return null when both dates are null', () => {
      const result = minDate(null, null)
      expect(result).toBeNull()
    })

    it('should return the same date when both dates are equal', () => {
      const date = timezone(new Date('2026-01-15'))
      const result = minDate(date, date)
      expect(result).toBe(date)
    })
  })

  describe('maxDate', () => {
    const timezone = tz('UTC')

    it('should return the chronologically last of two dates', () => {
      const date1 = timezone(new Date('2026-01-15'))
      const date2 = timezone(new Date('2026-01-20'))
      const result = maxDate(date1, date2)
      expect(result).toBe(date2)
    })

    it('should return the first date when it is later', () => {
      const date1 = timezone(new Date('2026-01-20'))
      const date2 = timezone(new Date('2026-01-15'))
      const result = maxDate(date1, date2)
      expect(result).toBe(date1)
    })

    it('should return date2 when date1 is null', () => {
      const date2 = timezone(new Date('2026-01-15'))
      const result = maxDate(null, date2)
      expect(result).toBe(date2)
    })

    it('should return date1 when date2 is null', () => {
      const date1 = timezone(new Date('2026-01-15'))
      const result = maxDate(date1, null)
      expect(result).toBe(date1)
    })

    it('should return null when both dates are null', () => {
      const result = maxDate(null, null)
      expect(result).toBeNull()
    })

    it('should return the same date when both dates are equal', () => {
      const date = timezone(new Date('2026-01-15'))
      const result = maxDate(date, date)
      expect(result).toBe(date)
    })
  })

  describe('rowGet', () => {
    it('should return the value for an existing column', () => {
      const testColumn = 'Name'
      const testValue = 'Test Market'
      const row = {
        data: { [testColumn]: testValue, Timezone: 'UTC' },
        file: 'markets.csv',
        line: 2,
      }
      const result = rowGet(row, testColumn)
      expect(result).toBe(testValue)
    })

    it('should return an empty string if the column value is empty', () => {
      const testColumn = 'Name'
      const emptyValue = ''
      const row = {
        data: { [testColumn]: emptyValue },
        file: 'markets.csv',
        line: 2,
      }
      const result = rowGet(row, testColumn)
      expect(result).toBe(emptyValue)
    })

    it('should throw an error with complete message including column name, file, line, and row data', () => {
      const columnName = 'Timezone'
      const rowData = { FinID: '12345', Name: 'NYSE' }
      const row = {
        data: rowData,
        file: 'schedules.csv',
        line: 10,
      }
      const expectedMessage = `Missing column '${columnName}' in row (schedules.csv:10) ${JSON.stringify(
        rowData,
        null,
        2,
      )}`
      expect(() => rowGet(row, columnName)).toThrow(expectedMessage)
    })
  })

  describe('getDaysOfWeekFromScheduleRow', () => {
    it('should parse a single day', () => {
      const row = {
        data: { Days: 'Mon' },
        file: 'schedules.csv',
        line: 1,
      }
      const result = getDaysOfWeekFromScheduleRow(row)
      expect(result).toEqual([1])
    })

    it('should parse multiple comma-separated days', () => {
      const row = {
        data: { Days: 'Mon,Wed,Fri' },
        file: 'schedules.csv',
        line: 1,
      }
      const result = getDaysOfWeekFromScheduleRow(row)
      expect(result).toEqual([1, 3, 5])
    })

    it('should parse a day range', () => {
      const row = {
        data: { Days: 'Mon-Fri' },
        file: 'schedules.csv',
        line: 1,
      }
      const result = getDaysOfWeekFromScheduleRow(row)
      expect(result).toEqual([1, 2, 3, 4, 5])
    })

    it('should wrap around the week for ranges that cross Sunday', () => {
      const row = {
        data: { Days: 'Fri-Mon' },
        file: 'schedules.csv',
        line: 1,
      }
      const result = getDaysOfWeekFromScheduleRow(row)
      expect(result).toEqual([5, 6, 0, 1])
    })

    it('should parse mixed comma-separated and range days', () => {
      const row = {
        data: { Days: 'Mon,Wed-Fri' },
        file: 'schedules.csv',
        line: 1,
      }
      const result = getDaysOfWeekFromScheduleRow(row)
      expect(result).toEqual([1, 3, 4, 5])
    })

    it('should throw error for invalid day name', () => {
      const rowData = { Days: 'Xyz' }
      const row = {
        data: rowData,
        file: 'schedules.csv',
        line: 5,
      }
      const expectedMessage = `Invalid day string 'Xyz' in row (schedules.csv:5) ${JSON.stringify(
        rowData,
        null,
        2,
      )}`
      expect(() => getDaysOfWeekFromScheduleRow(row)).toThrow(expectedMessage)
    })

    it('should throw error for invalid day name in range', () => {
      const rowData = { Days: 'Mon-Xyz' }
      const row = {
        data: rowData,
        file: 'schedules.csv',
        line: 5,
      }
      const expectedMessage = `Invalid day string 'Xyz' in row (schedules.csv:5) ${JSON.stringify(
        rowData,
        null,
        2,
      )}`
      expect(() => getDaysOfWeekFromScheduleRow(row)).toThrow(expectedMessage)
    })

    it('should throw error for invalid range with more than 2 parts', () => {
      const rowData = { Days: 'Mon-Wed-Fri' }
      const row = {
        data: rowData,
        file: 'schedules.csv',
        line: 5,
      }
      const expectedMessage = `Invalid day range 'Mon-Wed-Fri' in row (schedules.csv:5) ${JSON.stringify(
        rowData,
        null,
        2,
      )}`
      expect(() => getDaysOfWeekFromScheduleRow(row)).toThrow(expectedMessage)
    })

    it('should throw error for range with equal start and end days', () => {
      const rowData = { Days: 'Mon-Mon' }
      const row = {
        data: rowData,
        file: 'schedules.csv',
        line: 5,
      }
      const expectedMessage = `Equal start and end days in range 'Mon-Mon' in row (schedules.csv:5) ${JSON.stringify(
        rowData,
        null,
        2,
      )}`
      expect(() => getDaysOfWeekFromScheduleRow(row)).toThrow(expectedMessage)
    })
  })

  describe('getExceptionsFromSessionDifference', () => {
    it('should return empty exceptions when regular and holiday schedules are identical', () => {
      const date = '2026-01-15'
      const session = { start: '09:30:00', end: '16:00:00', endDateOffset: 0 as const }
      const regularSessions = [session]
      const holidaySessions = [session]

      const exceptions = getExceptionsFromSessionDifference(date, regularSessions, holidaySessions)

      expect(exceptions).toEqual([])
    })

    it('should generate exception when holiday is closed but regular is open', () => {
      const date = '2026-01-15'
      const regularSession = { start: '09:30:00', end: '16:00:00', endDateOffset: 0 as const }
      const regularSessions = [regularSession]
      const holidaySessions: Session[] = []

      const exceptions = getExceptionsFromSessionDifference(date, regularSessions, holidaySessions)

      expect(exceptions).toHaveLength(1)
      expect(exceptions[0]).toEqual({
        start: '2026-01-15 09:30:00',
        end: '2026-01-15 16:00:00',
        status: 'CLOSED',
      })
    })

    it('should generate exception when holiday is open but regular is closed', () => {
      const date = '2026-01-15'
      const holidaySession = { start: '10:00:00', end: '15:00:00', endDateOffset: 0 as const }
      const regularSessions: Session[] = []
      const holidaySessions = [holidaySession]

      const exceptions = getExceptionsFromSessionDifference(date, regularSessions, holidaySessions)

      expect(exceptions).toHaveLength(1)
      expect(exceptions[0]).toEqual({
        start: '2026-01-15 10:00:00',
        end: '2026-01-15 15:00:00',
        status: 'OPEN',
      })
    })

    it('should handle sessions spanning multiple days', () => {
      const date = '2026-01-15'
      const regularSession = { start: '16:00:00', end: '09:00:00', endDateOffset: 1 as const }
      const holidaySession = { start: '17:00:00', end: '08:00:00', endDateOffset: 1 as const }
      const regularSessions = [regularSession]
      const holidaySessions = [holidaySession]

      const exceptions = getExceptionsFromSessionDifference(date, regularSessions, holidaySessions)

      expect(exceptions).toEqual([
        {
          start: '2026-01-15 16:00:00',
          end: '2026-01-15 17:00:00',
          status: 'CLOSED',
        },
        {
          start: '2026-01-16 08:00:00',
          end: '2026-01-16 09:00:00',
          status: 'CLOSED',
        },
      ])
    })

    it('should handle multiple sessions', () => {
      const date = '2026-01-15'
      const regularSessions = [
        { start: '09:30:00', end: '12:00:00', endDateOffset: 0 as const },
        { start: '13:00:00', end: '16:00:00', endDateOffset: 0 as const },
      ]
      const holidaySessions = [{ start: '10:00:00', end: '15:00:00', endDateOffset: 0 as const }]

      const exceptions = getExceptionsFromSessionDifference(date, regularSessions, holidaySessions)

      expect(exceptions).toEqual([
        {
          start: '2026-01-15 09:30:00',
          end: '2026-01-15 10:00:00',
          status: 'CLOSED',
        },
        {
          start: '2026-01-15 12:00:00',
          end: '2026-01-15 13:00:00',
          status: 'OPEN',
        },
        {
          start: '2026-01-15 15:00:00',
          end: '2026-01-15 16:00:00',
          status: 'CLOSED',
        },
      ])
    })
  })

  describe('ScheduleGenerator', () => {
    it('should generate a complete schedule', () => {
      const mockFs = jest.mocked(fs)
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath === '/mock/csv/markets.csv') {
          return 'FinID,Timezone\n US:NYSE,America/New_York'
        }
        if (filePath === '/mock/csv/phases.csv') {
          return 'Name,Status\nPrimary Trading Session,Open'
        }
        if (filePath === '/mock/csv/schedules.csv') {
          return (
            'FinID,Schedule Group,Phase Type,In Force Start Date,In Force End Date,Days,Start,End,Offset Days\n' +
            'US:NYSE,Regular,Primary Trading Session,,,Mon-Fri,09:30:00,16:00:00,0\n' +
            'US:NYSE,Early Close,Primary Trading Session,,,Mon-Fri,09:30:00,12:45:00,0'
          )
        }
        if (filePath === '/mock/csv/holidays.csv') {
          return (
            'FinID,Date,Schedule\n' +
            'US:NYSE,2026-12-24,Early Close\n' +
            'US:NYSE,2026-12-25,Closed\n'
          )
        }
        return ''
      })

      const generator = new ScheduleGenerator({ csvDir: '/mock/csv', finId: 'US:NYSE' })
      const schedule = generator.getSchedule()

      expect(schedule).toEqual({
        timezone: 'America/New_York',
        lastValidDate: '2026-12-25',
        defaultStatus: 'CLOSED',
        weekly: [
          {
            status: 'OPEN',
            when: [
              {
                days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
                times: [{ start: '09:30:00', end: '16:00:00' }],
              },
            ],
          },
        ],
        exceptions: [
          {
            start: '2026-12-24 12:45:00',
            end: '2026-12-24 16:00:00',
            status: 'CLOSED',
          },
          {
            start: '2026-12-25 09:30:00',
            end: '2026-12-25 16:00:00',
            status: 'CLOSED',
          },
        ],
      })
    })

    it('should filter out schedules not in-force', () => {
      const mockFs = jest.mocked(fs)
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath === '/mock/csv/markets.csv') {
          return 'FinID,Timezone\n US:NYSE,America/New_York'
        }
        if (filePath === '/mock/csv/phases.csv') {
          return 'Name,Status\nPrimary Trading Session,Open'
        }
        if (filePath === '/mock/csv/schedules.csv') {
          return (
            'FinID,Schedule Group,Phase Type,In Force Start Date,In Force End Date,Days,Start,End,Offset Days\n' +
            'US:NYSE,Regular,Primary Trading Session,,2025-12-31,Mon-Fri,09:15:00,16:15:00,0\n' +
            'US:NYSE,Regular,Primary Trading Session,2026-01-01,2026-12-31,Mon-Fri,09:45:00,16:30:00,0\n' +
            'US:NYSE,Regular,Primary Trading Session,2027-01-01,,Mon-Fri,09:55:00,16:35:00,0\n'
          )
        }
        if (filePath === '/mock/csv/holidays.csv') {
          return 'FinID,Date,Schedule\n' + 'US:NYSE,2026-12-25,Closed\n'
        }
        return ''
      })

      const generator = new ScheduleGenerator({ csvDir: '/mock/csv', finId: 'US:NYSE' })
      const schedule = generator.getSchedule()

      expect(schedule).toEqual({
        timezone: 'America/New_York',
        lastValidDate: '2026-12-25',
        defaultStatus: 'CLOSED',
        weekly: [
          {
            status: 'OPEN',
            when: [
              {
                days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
                times: [{ start: '09:45:00', end: '16:30:00' }],
              },
            ],
          },
        ],
        exceptions: [
          {
            start: '2026-12-25 09:45:00',
            end: '2026-12-25 16:30:00',
            status: 'CLOSED',
          },
        ],
      })
    })

    it('should filter out holidays in the past', () => {
      const mockFs = jest.mocked(fs)
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath === '/mock/csv/markets.csv') {
          return 'FinID,Timezone\n US:NYSE,America/New_York'
        }
        if (filePath === '/mock/csv/phases.csv') {
          return 'Name,Status\nPrimary Trading Session,Open'
        }
        if (filePath === '/mock/csv/schedules.csv') {
          return (
            'FinID,Schedule Group,Phase Type,In Force Start Date,In Force End Date,Days,Start,End,Offset Days\n' +
            'US:NYSE,Regular,Primary Trading Session,,,Mon-Fri,09:30:00,16:00:00,0\n' +
            'US:NYSE,Early Close,Primary Trading Session,,,Mon-Fri,09:30:00,12:45:00,0'
          )
        }
        if (filePath === '/mock/csv/holidays.csv') {
          return (
            'FinID,Date,Schedule\n' +
            'US:NYSE,2025-12-24,Early Close\n' +
            'US:NYSE,2025-12-25,Closed\n' +
            'US:NYSE,2026-12-24,Early Close\n' +
            'US:NYSE,2026-12-25,Closed\n'
          )
        }
        return ''
      })

      const generator = new ScheduleGenerator({ csvDir: '/mock/csv', finId: 'US:NYSE' })
      const schedule = generator.getSchedule()

      expect(schedule).toEqual({
        timezone: 'America/New_York',
        lastValidDate: '2026-12-25',
        defaultStatus: 'CLOSED',
        weekly: [
          {
            status: 'OPEN',
            when: [
              {
                days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
                times: [{ start: '09:30:00', end: '16:00:00' }],
              },
            ],
          },
        ],
        exceptions: [
          {
            start: '2026-12-24 12:45:00',
            end: '2026-12-24 16:00:00',
            status: 'CLOSED',
          },
          {
            start: '2026-12-25 09:30:00',
            end: '2026-12-25 16:00:00',
            status: 'CLOSED',
          },
        ],
      })
    })

    it('should work with different schedules on different days', () => {
      const mockFs = jest.mocked(fs)
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath === '/mock/csv/markets.csv') {
          return 'FinID,Timezone\n US:NYSE,America/New_York'
        }
        if (filePath === '/mock/csv/phases.csv') {
          return 'Name,Status\nPrimary Trading Session,Open'
        }
        if (filePath === '/mock/csv/schedules.csv') {
          return (
            'FinID,Schedule Group,Phase Type,In Force Start Date,In Force End Date,Days,Start,End,Offset Days\n' +
            'US:NYSE,Regular,Primary Trading Session,,,Sun,20:30:00,04:00:00,1\n' +
            'US:NYSE,Regular,Primary Trading Session,,,Mon-Wed,17:00:00,16:00:00,1\n' +
            'US:NYSE,Regular,Primary Trading Session,,,"Fri,Sat",08:00:00,15:00:00,0\n'
          )
        }
        if (filePath === '/mock/csv/holidays.csv') {
          return 'FinID,Date,Schedule\n' + 'US:NYSE,2026-12-25,Closed\n'
        }
        return ''
      })

      const generator = new ScheduleGenerator({ csvDir: '/mock/csv', finId: 'US:NYSE' })
      const schedule = generator.getSchedule()

      expect(schedule).toEqual({
        timezone: 'America/New_York',
        lastValidDate: '2026-12-25',
        defaultStatus: 'CLOSED',
        weekly: [
          {
            status: 'OPEN',
            when: [
              {
                days: ['SUNDAY'],
                times: [{ start: '20:30:00', end: '24:00:00' }],
              },
              {
                days: ['MONDAY'],
                times: [
                  { start: '00:00:00', end: '04:00:00' },
                  { start: '17:00:00', end: '24:00:00' },
                ],
              },
              {
                days: ['TUESDAY', 'WEDNESDAY'],
                times: [
                  { start: '00:00:00', end: '16:00:00' },
                  { start: '17:00:00', end: '24:00:00' },
                ],
              },
              {
                days: ['THURSDAY'],
                times: [{ start: '00:00:00', end: '16:00:00' }],
              },
              {
                days: ['FRIDAY', 'SATURDAY'],
                times: [{ start: '08:00:00', end: '15:00:00' }],
              },
            ],
          },
        ],
        exceptions: [
          {
            start: '2026-12-25 08:00:00',
            end: '2026-12-25 15:00:00',
            status: 'CLOSED',
          },
        ],
      })
    })
  })
})
