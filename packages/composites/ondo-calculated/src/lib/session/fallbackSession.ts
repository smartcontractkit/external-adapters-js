import { TZDate } from '@date-fns/tz'

/**
 * Generates a list of session timestamps (ms since epoch) for the given boundaries.
 * Uses day offsets -1, 0, 1 to handle midnight crossover. Skips Sunday 8PM sessions.
 */
export const getSessionsFallback = (
  now: TZDate,
  sessionBoundaries: string[],
  sessionBoundariesTimeZone: string,
): number[] => {
  const timestamps: number[] = []

  ;[-1, 0, 1].forEach((offset) => {
    sessionBoundaries.forEach((b) => {
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
        return
      }
      timestamps.push(session.getTime())
    })
  })

  return timestamps
}
