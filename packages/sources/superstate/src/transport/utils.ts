import { formatInTimeZone } from 'date-fns-tz'
import { format, isAfter, isBefore, isSaturday, isSunday, subDays } from 'date-fns'

export const NetAssetValue = 'net_asset_value'
export const AssetsUnderManagement = 'assets_under_management'

// Converts a Date to a formatted string in the given timezone
export const toTimezoneDate = (date: string | Date, timezone: string): string => {
  return formatInTimeZone(date, timezone, 'yyyy-MM-dd HH:mm:ss')
}

// Checks if current time in the given timezone is before the endTimeS in the same timezone
export const isBeforeTime = (endTimeS: string, timezone: string): boolean => {
  const currentFullDateTZ = toTimezoneDate(new Date(), timezone)
  const currentShortDateTZ = format(currentFullDateTZ, 'yyyy-MM-dd')
  const targetFullDateTZ = toTimezoneDate(`${currentShortDateTZ} ${endTimeS}`, timezone)
  return isBefore(currentFullDateTZ, targetFullDateTZ)
}

// Checks if current time in the given timezone is after the startTimeS in the same timezone
export const isAfterTime = (startTimeS: string, timezone: string): boolean => {
  const currentFullDateTZ = toTimezoneDate(new Date(), timezone)
  const currentShortDateTZ = format(currentFullDateTZ, 'yyyy-MM-dd')
  const targetFullDateTZ = toTimezoneDate(`${currentShortDateTZ} ${startTimeS}`, timezone)
  return isAfter(currentFullDateTZ, targetFullDateTZ)
}

// Checks if the current time in the given timezone is within the specified startTimeS and endTimeS range
export const isInTimeRange = (startTimeS: string, endTimeS: string, timezone: string): boolean => {
  return isAfterTime(startTimeS, timezone) && isBeforeTime(endTimeS, timezone)
}

// Calculates the starting and ending dates for a given time window, relative to a reference date.
export const getStartingAndEndingDates = (window = 7, referenceDate = new Date()) => {
  const endDate = format(referenceDate, 'yyyy-MM-dd')
  const startDate = format(subDays(endDate, window - 1), 'yyyy-MM-dd')
  return { startDate, endDate }
}

// Returns the date string of the previous non-weekend day in the given timezone
export const getPreviousNonWeekendDay = (timezone: string): string => {
  const todayTZ = toTimezoneDate(new Date(), timezone)
  let pnwd = subDays(todayTZ, 1)
  if (isSaturday(pnwd)) {
    pnwd = subDays(todayTZ, 2)
  } else if (isSunday(pnwd)) {
    pnwd = subDays(todayTZ, 3)
  }
  return format(pnwd, 'MM/dd/yyyy')
}
