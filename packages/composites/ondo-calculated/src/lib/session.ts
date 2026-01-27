import { TZDate } from '@date-fns/tz'

// Seconds relative to session boundary (-ve before, +ve after)
export const calculateSecondsFromTransition = (
  sessionBoundaries: string[],
  sessionBoundariesTimeZone: string,
) => {
  const now = new TZDate(new Date().getTime(), sessionBoundariesTimeZone)
  // Handle cases where we're close to midnight
  const offsets = [-1, 0, 1]

  return offsets.reduce((minDiff, offset) => {
    const diff = calculateWithDayOffset(sessionBoundaries, sessionBoundariesTimeZone, now, offset)

    return Math.abs(diff) < Math.abs(minDiff) ? diff : minDiff
  }, Number.MAX_SAFE_INTEGER)
}

const calculateWithDayOffset = (
  sessionBoundaries: string[],
  sessionBoundariesTimeZone: string,
  now: TZDate,
  offset: number,
) =>
  sessionBoundaries.reduce((minDiff, b) => {
    const [hour, minute] = b.split(':')
    const session = new TZDate(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + offset,
      Number(hour),
      Number(minute),
      0,
      0,
      sessionBoundariesTimeZone,
    )

    // Skip Sunday 8PM because we don't want to use staled weekend data to smooth
    if (session.getHours() === 20 && session.getMinutes() === 0 && session.getDay() === 0) {
      return minDiff
    }

    const diff = (now.getTime() - session.getTime()) / 1000

    return Math.abs(diff) < Math.abs(minDiff) ? diff : minDiff
  }, Number.MAX_SAFE_INTEGER)
