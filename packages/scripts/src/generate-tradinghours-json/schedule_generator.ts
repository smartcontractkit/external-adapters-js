import { tz, TZDate } from '@date-fns/tz'
import { parse as parseCsv } from 'csv-parse/sync'
import { addDays, ContextFn, format, isValid, parseISO, startOfDay } from 'date-fns'
import * as fs from 'fs'
import * as path from 'path'

// The ScheduleGenerator generates schedule JSON that can be used by the
// static-market-hours adapter based on official TradingHours data.
//
// The official TradingHours data is provided in several CSV files.
// See README.md for how to acquire the data.
//
// markets.csv:
// Lists all the available markets and their timezones.
//
// schedules.csv:
// Contains many rows for each market containing schedule information. The rows
// with Schedule Group "Regular" describe the standard weekly schedule. All
// other Schedule Groups are references from the holidays.csv file and describe
// the schedule for specific holidays.
//
// Each row has a Phase Type that is mapped to a Status in phases.csv. The rows
// with Status "Open" are the ones that describe when the market is open.
//
// Some schedules are no longer (or not yet) relevant. This is described by the
// In Force Start Date and In Force End Date columns. Only rows that are in
// force are relevant for any particular date.
//
// Then each row has a Days column that describes which days of the week the
// schedule applies to. The Start and End columns describe the start and end
// times of the schedule. The Offset Days is used to indicate if the end time
// is on the next day.
//
// phases.csv:
// Contains a mapping of Phase Type to Status. We only care about the rows with
// Status "Open".
//
// holidays.csv:
// Describes the holidays for each market. A row for a specific date replaces
// the regular schedule for that date. Note that a schedule can span multiple
// days, so a holiday on a specific date can affect the schedule for the next
// day as well. The schedule for a holiday should be looked up in
// schedules.csv based on the Schedule column in the holiday row.

type Timezone = ContextFn<TZDate>

const DAYS_OF_WEEK = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
] as const

type DayOfWeek = (typeof DAYS_OF_WEEK)[number]
type DayOfWeekNumber = keyof typeof DAYS_OF_WEEK & number

export type Schedule = {
  timezone: string
  lastValidDate: string
  defaultStatus?: string
  weekly: {
    status: string
    when: {
      days: DayOfWeek[]
      times: {
        start: string // "HH:mm:ss"
        end: string // "HH:mm:ss"
      }[]
    }[]
  }[]
  exceptions: {
    status: string
    start: string // "yyyy-MM-dd HH:mm:ss"
    end: string // "yyyy-MM-dd HH:mm:ss"
  }[]
}

type Row = {
  data: Record<string, string>
  file: string
  line: number
}

export type Session = {
  start: string // "HH:mm:ss"
  end: string // "HH:mm:ss"
  endDateOffset: 0 | 1
}

const FILE_MARKETS = 'markets.csv'
const FILE_PHASES = 'phases.csv'
const FILE_SCHEDULES = 'schedules.csv'
const FILE_HOLIDAYS = 'holidays.csv'

const COLUMN_TIMEZONE = 'Timezone'
const COLUMN_PHASE_NAME = 'Name'
const COLUMN_PHASE_STATUS = 'Status'
const COLUMN_FIN_ID = 'FinID'
const COLUMN_SCHEDULE_GROUP = 'Schedule Group'
const COLUMN_PHASE_TYPE = 'Phase Type'
const COLUMN_IN_FORCE_START = 'In Force Start Date'
const COLUMN_IN_FORCE_END = 'In Force End Date'
const COLUMN_DAYS_OF_WEEK = 'Days'
const COLUMN_START_TIME = 'Start'
const COLUMN_END_TIME = 'End'
const COLUMN_END_TIME_DAYS_OFFSET = 'Offset Days'
const COLUMN_DATE = 'Date'
const COLUMN_SCHEDULE = 'Schedule'

const SCHEDULE_GROUP_REGULAR = 'Regular'
const STATUS_OPEN = 'Open'

const CSV_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
type CsvDayOfWeek = (typeof CSV_DAY_NAMES)[number]

const START_OF_DAY = '00:00:00'
const END_OF_DAY = '24:00:00'

export function minDate(date1: TZDate, date2: TZDate | null): TZDate
export function minDate(date1: TZDate | null, date2: TZDate): TZDate
export function minDate(date1: TZDate | null, date2: TZDate | null): TZDate | null
export function minDate(date1: TZDate | null, date2: TZDate | null): TZDate | null {
  if (date1 === null) return date2
  if (date2 === null) return date1
  return date1 < date2 ? date1 : date2
}

export const maxDate = (date1: TZDate | null, date2: TZDate | null): TZDate | null => {
  if (date1 === null) return date2
  if (date2 === null) return date1
  return date1 > date2 ? date1 : date2
}

export const rowGet = (row: Row, column: string): string => {
  const value = row.data[column]
  if (value === undefined) {
    failOnRow(`Missing column '${column}' in row`, row)
  }
  return value
}

// This is a 'function' instead of `const ... =>` because otherwise the TS
// compliler doesn't realize properly that this never returns.
function failOnRow(message: string, row: Row): never {
  throw new Error(`${message} (${row.file}:${row.line}) ${JSON.stringify(row.data, null, 2)}`)
}

// Converts a string like "Mon,Wed-Fri" into an array of DayOfWeekNumber
// values like [1, 3, 4, 5].
// Also wraps around the week, so "Fri-Mon" would return [5, 6, 0, 1].
export const getDaysOfWeekFromScheduleRow = (row: Row): DayOfWeekNumber[] => {
  const daysString = rowGet(row, COLUMN_DAYS_OF_WEEK)

  const getDayNumber = (dayString: string): DayOfWeekNumber => {
    const dayNumber = CSV_DAY_NAMES.indexOf(dayString as CsvDayOfWeek)
    if (dayNumber === -1) {
      failOnRow(`Invalid day string '${dayString}' in row`, row)
    }
    return dayNumber
  }

  const parseDays = (daysString: string): DayOfWeekNumber[] => {
    if (daysString.includes(',')) {
      return daysString.split(',').flatMap((s) => parseDays(s))
    }
    if (daysString.includes('-')) {
      const parts = daysString.split('-')
      if (parts.length !== 2) {
        failOnRow(`Invalid day range '${daysString}' in row`, row)
      }
      const startDay = getDayNumber(parts[0])
      let endDay = getDayNumber(parts[1])
      if (startDay === endDay) {
        failOnRow(`Equal start and end days in range '${daysString}' in row`, row)
      }
      if (endDay < startDay) {
        endDay += DAYS_OF_WEEK.length
      }
      const days: DayOfWeekNumber[] = []
      for (let d = startDay; d <= endDay; d++) {
        days.push(d % DAYS_OF_WEEK.length)
      }
      return days
    }

    return [getDayNumber(daysString)]
  }

  return parseDays(daysString)
}

export const getExceptionsFromSessionDifference = (
  date: string,
  regularSessions: Session[],
  holidaySessions: Session[],
): Schedule['exceptions'] => {
  const nextDate = format(addDays(parseISO(date), 1), 'yyyy-MM-dd')

  const getStartTime = (session: Session) => `${date} ${session.start}`
  const getEndTime = (session: Session) => {
    if (session.endDateOffset === 0) {
      return `${date} ${session.end}`
    } else {
      return `${nextDate} ${session.end}`
    }
  }

  type SessionBoundary = {
    time: string
    newStatus: 'OPEN' | 'CLOSED'
    schedule: 'regular' | 'holiday'
  }

  const sessionBoundaries: SessionBoundary[] = []

  for (const session of regularSessions) {
    sessionBoundaries.push({
      time: getStartTime(session),
      newStatus: 'OPEN',
      schedule: 'regular',
    })
    sessionBoundaries.push({
      time: getEndTime(session),
      newStatus: 'CLOSED',
      schedule: 'regular',
    })
  }
  for (const session of holidaySessions) {
    sessionBoundaries.push({
      time: getStartTime(session),
      newStatus: 'OPEN',
      schedule: 'holiday',
    })
    sessionBoundaries.push({
      time: getEndTime(session),
      newStatus: 'CLOSED',
      schedule: 'holiday',
    })
  }
  sessionBoundaries.sort((a, b) => a.time.localeCompare(b.time))

  const exceptions: Schedule['exceptions'] = []

  const status = {
    regular: 'CLOSED',
    holiday: 'CLOSED',
  }
  let lastTime = ''
  for (const boundary of sessionBoundaries) {
    if (lastTime !== boundary.time && status['regular'] !== status['holiday']) {
      exceptions.push({
        start: lastTime,
        end: boundary.time,
        status: status['holiday'],
      })
    }
    status[boundary.schedule] = boundary.newStatus
    lastTime = boundary.time
  }

  return exceptions
}

export class ScheduleGenerator {
  private readonly csvDir: string
  private readonly finId: string
  private readonly phaseToStatus: Map<string, string> = new Map()
  private timezoneString: string | null = null
  private timezone: Timezone | null = null
  private today: TZDate | null = null
  private openRowsBySchedule: Map<string, Row[]> = new Map()
  private weeklySessionsBySchedule: Map<string, Map<DayOfWeekNumber, Session[]>> = new Map()
  private holidayRows: Row[] | null = null

  constructor({ csvDir, finId }: { csvDir: string; finId: string }) {
    this.csvDir = csvDir
    this.finId = finId
  }

  loadCsv(filename: string): Row[] {
    const filePath = path.join(this.csvDir, filename)
    // Check if file exists:
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`)
    }
    const content = fs.readFileSync(filePath, 'utf8')
    const parsed = parseCsv(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      info: true,
    }) as {
      record: Record<string, string>
      info: { lines: number }
    }[]
    const rows: Row[] = []
    for (const {
      record: data,
      info: { lines: line },
    } of parsed) {
      rows.push({
        data,
        file: filePath,
        line,
      })
    }
    return rows
  }

  initTimezone(): void {
    if (this.timezone !== null) {
      return
    }
    const marketRows = this.loadCsv(FILE_MARKETS).filter(
      (row) => rowGet(row, COLUMN_FIN_ID) === this.finId,
    )

    if (marketRows.length !== 1) {
      throw new Error(
        `Expected exactly one market row for FIN ID ${this.finId} in ${FILE_MARKETS}, found ${marketRows.length}`,
      )
    }

    this.timezoneString = marketRows[0].data[COLUMN_TIMEZONE]
    this.timezone = tz(this.timezoneString)
    this.today = startOfDay(Date.now(), { in: this.timezone })
  }

  getTimezoneString(): string {
    this.initTimezone()
    return this.timezoneString!
  }

  getTimezone(): Timezone {
    this.initTimezone()
    return this.timezone!
  }

  getToday(): TZDate {
    this.initTimezone()
    return this.today as TZDate
  }

  parseDate(row: Row, column: string): TZDate | null {
    const dateString = rowGet(row, column)
    if (dateString === '') {
      return null
    }

    const date = parseISO(dateString, { in: this.getTimezone() })
    if (!isValid(date)) {
      failOnRow(`Invalid date string '${dateString}' in column '${column}' of row`, row)
    }
    return startOfDay(date) as TZDate
  }

  parseRequiredDate(row: Row, column: string): TZDate {
    const date = this.parseDate(row, column)
    if (date === null) {
      failOnRow(`Missing required date in column '${column}' of row`, row)
    }
    return date
  }

  initPhaseToStatusMap(): void {
    if (this.phaseToStatus.size > 0) {
      return
    }
    const phaseRows = this.loadCsv(FILE_PHASES)
    for (const {
      data: { [COLUMN_PHASE_NAME]: phase, [COLUMN_PHASE_STATUS]: status },
    } of phaseRows) {
      this.phaseToStatus.set(phase, status)
    }
  }

  getPhaseTypeStatus(row: Row): string {
    this.initPhaseToStatusMap()

    const phase = rowGet(row, COLUMN_PHASE_TYPE)

    if (!phase) {
      failOnRow('Missing Phase Type in row', row)
    }

    const status = this.phaseToStatus.get(phase)

    if (!status) {
      failOnRow(`Phase Type '${phase}' is not present in ${FILE_PHASES} used in row`, row)
    }

    return status
  }

  filterInForceScheduleRows(rows: Row[]): Row[] {
    return rows.filter((row) => {
      const start = this.parseDate(row, COLUMN_IN_FORCE_START)
      const end = this.parseDate(row, COLUMN_IN_FORCE_END)
      const today = this.getToday()
      if (start && start > today) {
        return false
      }
      if (end && end <= today) {
        return false
      }
      return true
    })
  }

  getOpenScheduleRows(scheduleGroup: string): Row[] {
    this.initOpenRowsBySchedule(scheduleGroup)
    return this.openRowsBySchedule.get(scheduleGroup)!
  }

  initOpenRowsBySchedule(scheduleGroup: string): void {
    if (this.openRowsBySchedule.has(scheduleGroup)) {
      return
    }
    const allScheduleRows = this.loadCsv(FILE_SCHEDULES)
    const marketScheduleRows = allScheduleRows.filter(
      (row) => rowGet(row, COLUMN_FIN_ID) === this.finId,
    )
    const groupScheduleRows = marketScheduleRows.filter(
      (row) => rowGet(row, COLUMN_SCHEDULE_GROUP) === scheduleGroup,
    )
    const openScheduleRows = groupScheduleRows.filter((row) => {
      const status = this.getPhaseTypeStatus(row)
      return status === STATUS_OPEN
    })

    this.openRowsBySchedule.set(scheduleGroup, this.filterInForceScheduleRows(openScheduleRows))
  }

  // TradingHours attributes every session to a specific day, even though the
  // session may span multiple days. If a certain day has a holiday, the
  // holiday schedule replaces the normal schedule for that day, including
  // parts that fall outside that day. So we need a representation of the
  // weekly schedule that takes this into account.
  // getWeeklySessions returns this representation while getWeeklySchedule
  // strictly has times for a specific day be inside that day.
  getWeeklySessions(scheduleGroup: string): Map<DayOfWeekNumber, Session[]> {
    this.initWeeklySessions(scheduleGroup)
    return this.weeklySessionsBySchedule.get(scheduleGroup)!
  }

  initWeeklySessions(scheduleGroup: string): void {
    if (this.weeklySessionsBySchedule.has(scheduleGroup)) {
      return
    }

    const weeklyScheduleRows = this.getOpenScheduleRows(scheduleGroup)

    // Initialize with an empty array for each day of the week
    const sessionsByDay: Map<DayOfWeekNumber, Session[]> = new Map(
      CSV_DAY_NAMES.map((_, index) => [index, []]),
    )

    for (const row of weeklyScheduleRows) {
      const days = getDaysOfWeekFromScheduleRow(row)
      const start = rowGet(row, COLUMN_START_TIME)
      const end = rowGet(row, COLUMN_END_TIME)
      const endDateOffset = rowGet(row, COLUMN_END_TIME_DAYS_OFFSET)
      if (!['0', '1'].includes(endDateOffset)) {
        failOnRow(
          `${COLUMN_END_TIME_DAYS_OFFSET} other than "0" or "1" is not yet supported. Found in row`,
          row,
        )
      }

      if (start === end && endDateOffset === '0') {
        // Ignore zero-length session.
        continue
      }

      for (const day of days) {
        sessionsByDay.get(day)!.push({ start, end, endDateOffset: Number(endDateOffset) as 0 | 1 })
      }
    }

    for (const sessions of sessionsByDay.values()) {
      sessions.sort((a, b) => a.start.localeCompare(b.start))
    }

    this.weeklySessionsBySchedule.set(scheduleGroup, sessionsByDay)
  }

  getWeeklySchedule(): Schedule['weekly'] {
    const sessionsByDay = this.getWeeklySessions(SCHEDULE_GROUP_REGULAR)

    // Initialize with an empty array for each day of the week
    const timeRangesByDay: Map<DayOfWeekNumber, { start: string; end: string }[]> = new Map(
      CSV_DAY_NAMES.map((_, index) => [index, []]),
    )

    for (const [day, sessions] of sessionsByDay.entries()) {
      for (const { start, end, endDateOffset } of sessions) {
        if (endDateOffset === 0) {
          const timeRange = { start, end }
          timeRangesByDay.get(day)!.push(timeRange)
        } else {
          // endDateOffset === 1
          timeRangesByDay.get(day)!.push({ start, end: END_OF_DAY })
          timeRangesByDay.get((day + 1) % DAYS_OF_WEEK.length)!.push({ start: START_OF_DAY, end })
        }
      }
    }

    const daysByTimeRanges = new Map<string, DayOfWeekNumber[]>()

    for (const [day, timeRanges] of timeRangesByDay.entries()) {
      if (timeRanges.length === 0) {
        continue
      }
      const key = JSON.stringify(timeRanges)
      let days = daysByTimeRanges.get(key)
      if (days === undefined) {
        days = []
        daysByTimeRanges.set(key, days)
      }
      days.push(day)
    }

    return [
      {
        status: 'OPEN',
        when: Array.from(daysByTimeRanges.entries()).map(([timeRangesKey, days]) => ({
          days: days.map((day) => DAYS_OF_WEEK[day]),
          times: JSON.parse(timeRangesKey),
        })),
      },
    ]
  }

  getHolidayRows(): Row[] {
    this.initHolidayRows()
    return this.holidayRows!
  }

  initHolidayRows(): void {
    if (this.holidayRows !== null) {
      return
    }
    const todayString = format(this.getToday(), 'yyyy-MM-dd')
    this.holidayRows = this.loadCsv(FILE_HOLIDAYS).filter(
      (row) => rowGet(row, COLUMN_FIN_ID) === this.finId && rowGet(row, COLUMN_DATE) >= todayString,
    )
  }

  getExceptionsForHolidayRow(row: Row): Schedule['exceptions'] {
    const date = rowGet(row, COLUMN_DATE)
    const dayOfWeek = parseISO(date, { in: this.getTimezone() }).getDay() as DayOfWeekNumber
    const scheduleGroup = rowGet(row, COLUMN_SCHEDULE)
    const holidaySessions = this.getWeeklySessions(scheduleGroup).get(dayOfWeek)!
    const regularSessions = this.getWeeklySessions(SCHEDULE_GROUP_REGULAR).get(dayOfWeek)!

    return getExceptionsFromSessionDifference(date, regularSessions, holidaySessions)
  }

  getExceptions(): Schedule['exceptions'] {
    return this.getHolidayRows().flatMap((row) => this.getExceptionsForHolidayRow(row))
  }

  getLastValidDate(): string {
    let earliestInForceEndDate: TZDate | null = null
    for (const row of this.getOpenScheduleRows(SCHEDULE_GROUP_REGULAR)) {
      const endDate = this.parseDate(row, COLUMN_IN_FORCE_END)
      earliestInForceEndDate = minDate(earliestInForceEndDate, endDate)
    }
    let lastHolidayDate: TZDate | null = null
    for (const holidayRow of this.getHolidayRows()) {
      const holidayDate = this.parseRequiredDate(holidayRow, COLUMN_DATE)
      lastHolidayDate = maxDate(lastHolidayDate, holidayDate)
    }
    if (lastHolidayDate === null) {
      throw new Error('Could not determine last valid date. No future holiday rows found.')
    }
    const lastValidDate = minDate(earliestInForceEndDate, lastHolidayDate)
    return format(lastValidDate, 'yyyy-MM-dd')
  }

  getSchedule(): Schedule {
    return {
      timezone: this.getTimezoneString(),
      lastValidDate: this.getLastValidDate(),
      defaultStatus: 'CLOSED',
      weekly: this.getWeeklySchedule(),
      exceptions: this.getExceptions(),
    }
  }
}
