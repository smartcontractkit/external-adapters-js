import { toZonedTime } from 'date-fns-tz'
import { addDays, differenceInMilliseconds, format, parse, subDays } from 'date-fns'

export const getTimeDifference = (targetTimeString: string, timezone: string): number => {
  const currentUTC = new Date()

  // Convert current UTC time to specified timezone
  const currentET = toZonedTime(currentUTC, timezone)

  // Set the target time to today's  AM ET
  let targetTime = parse(targetTimeString, 'HH:mm', currentET)

  // Check if the current time is after targetTime. If so, set the targetTime to the same time tomorrow
  if (currentET > targetTime) {
    //
    targetTime = addDays(targetTime, 1)
  }

  // Return the difference in milliseconds
  return differenceInMilliseconds(targetTime, currentET)
}

// Calculates the starting and ending dates for a given time window, relative to a reference date.
export const getStartingAndEndingDates = (window = 7, referenceDate = new Date()) => {
  const endDate = format(referenceDate, 'yyyy-MM-dd')
  const startDate = format(subDays(endDate, window - 1), 'yyyy-MM-dd')
  return { startDate, endDate }
}
