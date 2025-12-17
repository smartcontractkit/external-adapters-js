import { TZDate } from '@date-fns/tz'

// Seconds relative to session boundary (-ve before, +ve after)
export const calculateSecondsFromTransition = (
  sessionBoundaries: string[],
  sessionBoundariesTimeZone: string,
) => {
  const now = new TZDate(new Date().getTime(), sessionBoundariesTimeZone)
  let minDiff = Number.MAX_SAFE_INTEGER

  sessionBoundaries.forEach((b) => {
    const [hour, minute] = b.split(':')
    const session = new TZDate(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      Number(hour),
      Number(minute),
      0,
      0,
      sessionBoundariesTimeZone,
    )

    const diff = (now.getTime() - session.getTime()) / 1000

    if (Math.abs(diff) < Math.abs(minDiff)) {
      minDiff = diff
    }
  })

  return minDiff
}
