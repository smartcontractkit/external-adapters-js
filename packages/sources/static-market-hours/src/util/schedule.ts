import {
  MarketStatus,
  TwentyfourFiveMarketStatus,
} from '@chainlink/external-adapter-framework/adapter'
import { tz, TZDate } from '@date-fns/tz'
import { addDays, addHours, ContextFn, format, isValid, parse, startOfDay } from 'date-fns'

type Timezone = ContextFn<TZDate>

const daysOfWeek = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const

type DayOfWeek = (typeof daysOfWeek)[number]

const marketStatusTypes = {
  MarketStatus,
  TwentyfourFiveMarketStatus,
} as const

type ValueOf<T> = T[keyof T]

export type MarketStatusType = ValueOf<typeof marketStatusTypes>

type EnumType<E extends MarketStatusType> = ValueOf<E>
type EnumString<E extends MarketStatusType> = Extract<keyof E, string>

export type Schedule<StatusType extends MarketStatusType> = {
  timezone: string
  lastValidDate: string
  defaultStatus?: EnumString<StatusType>
  weekly: {
    status: EnumString<StatusType>
    when: {
      days: DayOfWeek[]
      times: {
        start: string // "HH:mm:ss"
        end: string // "HH:mm:ss"
      }[]
    }[]
  }[]
  exceptions: {
    status: EnumString<StatusType>
    start: string // "yyyy-MM-dd HH:mm:ss"
    end: string // "yyyy-MM-dd HH:mm:ss"
  }[]
}

export type MarketStatusResult<StatusType extends MarketStatusType> = {
  result: EnumType<StatusType>
  statusString: EnumString<StatusType>
}

const dateFormat = 'yyyy-MM-dd'
const timeFormat = 'HH:mm:ss'
const dateTimeFormat = `${dateFormat} ${timeFormat}`

export const getMarketStatusFromSchedule = <StatusType extends MarketStatusType>(
  timestampMs: number,
  scheduleData: Schedule<StatusType>,
  usedMarketStatusType: StatusType,
): MarketStatusResult<StatusType> => {
  const statusString = getStatusStringFromSchedule(timestampMs, scheduleData)
  const result = usedMarketStatusType[statusString]
  if (result === undefined) {
    throw new Error(
      `Invalid status "${String(statusString)}" for market status type "${String(
        usedMarketStatusType,
      )}"`,
    )
  }
  return { result, statusString }
}

export const getStatusStringFromSchedule = <StatusType extends MarketStatusType>(
  timestampMs: number,
  scheduleData: Schedule<StatusType>,
): EnumString<StatusType> => {
  const timezone = scheduleData.timezone
  const now = new TZDate(timestampMs, timezone)
  const nowFormatted = format(now, dateTimeFormat)

  for (const e of scheduleData.exceptions) {
    if (e.start <= nowFormatted && nowFormatted < e.end) {
      return e.status
    }
  }

  const dayOfWeek = format(now, 'EEEE').toUpperCase() as DayOfWeek
  for (const weekly of scheduleData.weekly) {
    for (const when of weekly.when) {
      if (!when.days.includes(dayOfWeek)) {
        continue
      }
      for (const times of when.times) {
        const startTime = parseTime(times.start, now)
        const endTime = parseTime(times.end, now)
        if (startTime <= now && now < endTime) {
          return weekly.status
        }
      }
    }
  }

  if (scheduleData.defaultStatus) {
    return scheduleData.defaultStatus
  }

  throw new Error(`No market status found for current time: ${nowFormatted}`)
}

const parseTime = (time: string, date: TZDate): TZDate => {
  if (time === '24:00:00') {
    const startOfDate = startOfDay(date)
    return addHours(startOfDate, 24)
  }
  return parse(time, timeFormat, date)
}

export const isValidTimezone = (timezone: string): boolean => {
  return timezone !== undefined && isValid(tz(timezone)(0))
}

const validateTimezone = (timezone: string): void => {
  if (!isValidTimezone(timezone)) {
    throw new Error(`Invalid timezone: '${timezone}'`)
  }
}

const validateLastValidDate = (lastValidDateStr: string, timezone: Timezone): void => {
  if (!lastValidDateStr) {
    throw new Error('lastValidDate is required and missing.')
  }

  const lastValidDate = startOfDay(
    parse(lastValidDateStr, dateFormat, new Date(), { in: timezone }),
  )

  if (!isValid(lastValidDate)) {
    throw new Error(`lastValidDate must have format '${dateFormat}'. Found: '${lastValidDateStr}'`)
  }

  const firstInvalidTime = addDays(lastValidDate, 1)

  if (Date.now() >= firstInvalidTime.getTime()) {
    throw new Error(`Last valid date '${lastValidDateStr}' should not be in the past.`)
  }
}

const validateStatusStrings = <StatusType extends MarketStatusType>(
  statusStrings: string[],
  usedMarketStatusType: StatusType,
): void => {
  const statusNames = Object.values(usedMarketStatusType).filter((key) => typeof key === 'string')
  for (const status of statusStrings) {
    if (!statusNames.includes(status)) {
      throw new Error(`Status should be one of '${statusNames.join(`', '`)}'. Found: '${status}'`)
    }
  }
}

const validateUniqueWeeklyStatus = <StatusType extends MarketStatusType>(
  scheduleData: Schedule<StatusType>,
): void => {
  const seenStatuses = new Set<string | undefined>()
  for (const weekly of scheduleData.weekly) {
    if (seenStatuses.has(weekly.status)) {
      throw new Error(`Duplicate status '${weekly.status}' found in weekly schedule.`)
    }
    seenStatuses.add(weekly.status)
  }
  if (seenStatuses.has(scheduleData.defaultStatus)) {
    throw new Error(
      `Weekly schedule contains section with status '${scheduleData.defaultStatus}' which is also used as defaultStatus.`,
    )
  }
}

const validateUniqueWeeklyDays = <StatusType extends MarketStatusType>(
  scheduleData: Schedule<StatusType>,
): void => {
  for (const weekly of scheduleData.weekly) {
    const seenWeekdays = new Set<DayOfWeek>()
    for (const when of weekly.when) {
      for (const day of when.days) {
        if (!daysOfWeek.includes(day)) {
          throw new Error(`Invalid weekday '${day}' found in weekly schedule.`)
        }
        if (seenWeekdays.has(day)) {
          throw new Error(`Duplicate weekday '${day}' found in weekly schedule.`)
        }
        seenWeekdays.add(day)
      }
    }
  }
}

const validateTimeFormat = (timeStr: string, expectedFormat: string): void => {
  const parsed = parse(timeStr, expectedFormat, new Date())
  if (!isValid(parsed) || format(parsed, expectedFormat) !== timeStr) {
    throw new Error(`Invalid time format: '${timeStr}'. Expected format is '${expectedFormat}'`)
  }
}

const validateTime = (timeStr: string): void => {
  validateTimeFormat(timeStr, timeFormat)
}

const validateTimeSegment = (timeSegment: { start: string; end: string }): void => {
  validateTime(timeSegment.start)
  if (timeSegment.end !== '24:00:00') {
    validateTime(timeSegment.end)
  }
  if (timeSegment.start >= timeSegment.end) {
    throw new Error(
      `Invalid time segment: start time '${timeSegment.start}' must be before end time '${timeSegment.end}'`,
    )
  }
}

const validateWeeklyCoverage = <StatusType extends MarketStatusType>(
  scheduleData: Schedule<StatusType>,
): void => {
  const timeSegmentsByDay: Record<DayOfWeek, { start: string; end: string }[]> = {
    MONDAY: [],
    TUESDAY: [],
    WEDNESDAY: [],
    THURSDAY: [],
    FRIDAY: [],
    SATURDAY: [],
    SUNDAY: [],
  }
  for (const weekly of scheduleData.weekly) {
    for (const when of weekly.when) {
      for (const day of when.days) {
        for (const timeSegment of when.times) {
          validateTimeSegment(timeSegment)
          timeSegmentsByDay[day].push(timeSegment)
        }
      }
    }
  }

  let timeNotCovered = undefined

  for (const day of daysOfWeek) {
    const segments = timeSegmentsByDay[day]
    segments.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))
    let lastEndTime = '00:00:00'
    for (const segment of segments) {
      if (segment.start < lastEndTime) {
        throw new Error(
          `Overlapping time segments found for '${day}' in weekly schedule between '${segment.start}' and '${lastEndTime}'.`,
        )
      } else if (segment.start > lastEndTime) {
        timeNotCovered ??= `${lastEndTime} to ${segment.start} on ${day}`
      }
      lastEndTime = segment.end
    }
    if (lastEndTime !== '24:00:00') {
      timeNotCovered ??= `${lastEndTime} to 24:00:00 on ${day}`
    }
  }

  if (timeNotCovered === undefined && scheduleData.defaultStatus) {
    throw new Error('Weekly schedule covers all times for all days so defaultStatus is unused.')
  }

  if (timeNotCovered && !scheduleData.defaultStatus) {
    throw new Error(
      `defaultStatus should be set because weekly schedule does not cover ${timeNotCovered}.`,
    )
  }
}

const validateWeeklySchedule = <StatusType extends MarketStatusType>(
  scheduleData: Schedule<StatusType>,
): void => {
  validateUniqueWeeklyStatus(scheduleData)
  validateUniqueWeeklyDays(scheduleData)
  validateWeeklyCoverage(scheduleData)
}

const validateDateTime = (dateTimeStr: string): void => {
  validateTimeFormat(dateTimeStr, dateTimeFormat)
}

const validateExceptions = <StatusType extends MarketStatusType>(
  scheduleData: Schedule<StatusType>,
): void => {
  let lastStartTime = '0000-00-00 00:00:00'
  let lastEndTime = '0000-00-00 00:00:00'
  for (const exception of scheduleData.exceptions) {
    validateDateTime(exception.start)
    validateDateTime(exception.end)
    if (exception.start >= exception.end) {
      throw new Error(
        `Invalid exception: start time '${exception.start}' must be before end time '${exception.end}'.`,
      )
    }
    if (exception.start < lastStartTime) {
      throw new Error(
        `Exceptions must be sorted by start time. Found exception with start time '${lastStartTime}' before '${exception.start}'.`,
      )
    }
    if (exception.start < lastEndTime) {
      throw new Error(
        `Overlapping exceptions found in schedule between '${lastEndTime}' and '${exception.start}'.`,
      )
    }
    lastStartTime = exception.start
    lastEndTime = exception.end
  }
}

export const getScheduleValidationError = <StatusType extends MarketStatusType>(
  scheduleJson: string,
  usedMarketStatusType: StatusType,
): string | undefined => {
  try {
    const scheduleData = JSON.parse(scheduleJson) as Schedule<StatusType>

    validateTimezone(scheduleData.timezone)

    const timezone = tz(scheduleData.timezone)

    validateLastValidDate(scheduleData.lastValidDate, timezone)

    validateStatusStrings(
      [
        ...(scheduleData.defaultStatus ? [scheduleData.defaultStatus] : []),
        ...[...scheduleData.weekly, ...scheduleData.exceptions].map((s) => s.status),
      ],
      usedMarketStatusType,
    )

    validateWeeklySchedule(scheduleData)
    validateExceptions(scheduleData)

    return undefined
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}
