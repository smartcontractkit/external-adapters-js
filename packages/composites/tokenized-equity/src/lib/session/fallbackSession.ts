import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { TZDate } from '@date-fns/tz'
import type { SessionEvent } from './types'

/**
 * Generates session start events (ms since epoch) from the configured
 * boundaries. Uses day offsets -1, 0, 1 to handle midnight crossover.
 *
 * These events carry no status; the gate treats them as start-time-only
 * boundaries. Sunday 20:00 is included here and filtered out of the smoothing
 * boundaries by the caller, so a Sunday reopen can still be gated.
 */
export const getFallbackSessionEvents = (
  now: TZDate,
  sessionBoundaries: string[],
  sessionBoundariesTimeZone: string,
): SessionEvent[] => {
  const events: SessionEvent[] = []
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

      events.push({ status: TwentyfourFiveMarketStatus.UNKNOWN, startMs: session.getTime() })
    })
  })

  return events.sort((a, b) => a.startMs - b.startMs)
}
