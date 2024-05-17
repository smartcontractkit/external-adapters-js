import { toZonedTime } from 'date-fns-tz'
import { format, isAfter, isBefore, parse, subDays } from 'date-fns'

export const getCurrentDateTime = (time: string, timezone: string) => {
  const currentUTC = new Date()

  const currentTime = toZonedTime(currentUTC, timezone)
  const currentDate = format(currentTime, 'yyyy-MM-dd')

  const timeZonedDate = parse(`${currentDate} ${time}`, 'yyyy-MM-dd HH:mm:ss', currentTime)
  return { currentTime, timeZonedDate }
}

export const isInTimeRange = (startTimeS: string, endTimeS: string, timezone: string): boolean => {
  return isAfterTime(startTimeS, timezone) && isBeforeTime(endTimeS, timezone)
}

export const isAfterTime = (startTimeS: string, timezone: string) => {
  const { currentTime, timeZonedDate: startTime } = getCurrentDateTime(startTimeS, timezone)
  return isAfter(currentTime, startTime)
}

export const isBeforeTime = (endTimeS: string, timezone: string) => {
  const { currentTime, timeZonedDate: endTime } = getCurrentDateTime(endTimeS, timezone)
  return isBefore(currentTime, endTime)
}

// Calculates the starting and ending dates for a given time window, relative to a reference date.
export const getStartingAndEndingDates = (window = 7, referenceDate = new Date()) => {
  const endDate = format(referenceDate, 'yyyy-MM-dd')
  const startDate = format(subDays(endDate, window - 1), 'yyyy-MM-dd')
  return { startDate, endDate }
}
