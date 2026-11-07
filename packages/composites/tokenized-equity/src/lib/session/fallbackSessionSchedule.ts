import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { TZDate } from '@date-fns/tz'

import { SessionTransition } from './tradingHoursSession'

// Hard-coded fallback session schedules for session-start (pre-open warm-up) gating:
// the labeled last resort when the tradinghours market-session schedule is unavailable
// or unusable. Gating deliberately never uses the per-feed sessionBoundaries
// parameter — its times are unlabeled and conventionally lack the regular open.
//
// Keyed by `<market>/<type>` for the market/types we actually serve. An entry is the
// single source of per-market truth: its timezone drives both the tradinghours fetch
// (which requires one) and the evaluation of the fallback opens below. A market/type
// without an entry cannot be gated at all — callers fail closed.
//
// weeklyOpens is keyed by Date.getDay() (0 = Sunday … 6 = Saturday): lookup is
// weeklyOpens[zonedDate.getDay()]. Keys are explicit so each line asserts its own
// day — a positional list would be silently reorderable.
type SessionOpen = {
  at: string // 'HH:MM' in the venue's local time
  opens: TwentyfourFiveMarketStatus
}

type FallbackSchedule = {
  timezone: string
  weeklyOpens: Partial<Record<number, SessionOpen[]>>
}

const WEEKDAY_OPENS: SessionOpen[] = [
  { at: '04:00', opens: TwentyfourFiveMarketStatus.PRE_MARKET },
  { at: '09:30', opens: TwentyfourFiveMarketStatus.REGULAR },
  { at: '16:00', opens: TwentyfourFiveMarketStatus.POST_MARKET },
  { at: '20:00', opens: TwentyfourFiveMarketStatus.OVERNIGHT },
]

const FALLBACK_SESSION_SCHEDULE: Record<string, FallbackSchedule> = {
  // Mirrors the nyse/24/5 structure from tradinghours: overnight sessions open 20:00
  // Sun–Thu (running to 04:00 the next day); Friday 20:00 → weekend.
  'nyse/24/5': {
    timezone: 'America/New_York',
    weeklyOpens: {
      0: [{ at: '20:00', opens: TwentyfourFiveMarketStatus.OVERNIGHT }], // Sunday
      1: WEEKDAY_OPENS,
      2: WEEKDAY_OPENS,
      3: WEEKDAY_OPENS,
      4: WEEKDAY_OPENS,
      5: WEEKDAY_OPENS.filter((o) => o.opens !== TwentyfourFiveMarketStatus.OVERNIGHT), // Friday
      6: [], // Saturday
    },
  },
}

// Both segments lowercased for lookup — a silent miss here fails gating closed, so the
// key match should be forgiving (slightly more lenient than upstream, which lowercases
// only `market`).
const getFallbackEntry = (market: string, marketType: string): FallbackSchedule | undefined =>
  FALLBACK_SESSION_SCHEDULE[`${market.toLowerCase()}/${marketType.toLowerCase()}`]

// The timezone gating should use for a market/type (tradinghours fetch + fallback
// evaluation), independent of the request's sessionBoundariesTimeZone.
export const getGatingTimezone = (market: string, marketType: string): string | undefined =>
  getFallbackEntry(market, marketType)?.timezone

// Labeled session-open transitions for the days surrounding nowMs, or undefined when the
// market/type has no hard-coded entry. Day offsets -2..+1 cover at least tradinghours'
// rolling [now-1d, now+1d] window: at Saturday 00:00–04:00 ET the current overnight
// session opened Thursday 20:00, which -1..+1 (Fri/Sat/Sun) cannot see — Friday has no
// overnight open and Saturday has none at all — so the narrower window failed closed
// while tradinghours still resolved the session.
export const getFallbackSessionTransitions = (
  market: string,
  marketType: string,
  nowMs: number,
): SessionTransition[] | undefined => {
  const entry = getFallbackEntry(market, marketType)
  if (!entry) {
    return undefined
  }

  const now = new TZDate(nowMs, entry.timezone)
  const transitions: SessionTransition[] = []

  for (const offset of [-2, -1, 0, 1]) {
    const day = new TZDate(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + offset,
      0,
      0,
      0,
      0,
      entry.timezone,
    )
    for (const open of entry.weeklyOpens[day.getDay()] ?? []) {
      const [hour, minute] = open.at.split(':').map(Number)
      transitions.push({
        status: open.opens,
        timeMs: new TZDate(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
          hour,
          minute,
          0,
          0,
          entry.timezone,
        ).getTime(),
      })
    }
  }

  return transitions
}
