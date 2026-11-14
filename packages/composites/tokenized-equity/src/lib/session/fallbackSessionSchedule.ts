import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { TZDate } from '@date-fns/tz'

import { SessionTransition } from './tradingHoursSession'

// Hard-coded fallback session schedule for session-start gating: the labeled last
// resort when the tradinghours market-session schedule is unavailable or unusable.
// Gating deliberately never uses the per-feed sessionBoundaries parameter — its
// times are unlabeled and conventionally lack the regular open.
//
// Flattened (24/7 session-start gating TDD §4) to a single per-market entry
// holding the session opens, with an end on every entry — shaped congruently with
// the tradinghours market-session response (tradinghours ADR-0001). Like the
// upstream model, the weekend/holiday closed span is an absence of phases: its
// start is the end of the last phase before the gap (Friday post-market, 20:00
// ET), derived by callers (closedSpanStartMs). Each marketType sees a filtered
// view of the one schedule (no duplicated hard-coded times): 24/5 and regular
// callers get exactly the transitions they had before the flatten
// (byte-identical 24/5 gating behavior).
//
// An entry is the single source of per-market truth: its timezone drives both the
// tradinghours fetch (which requires one) and the evaluation of the opens below. A
// market without an entry cannot be gated at all — callers fail closed.
//
// weeklyOpens is keyed by Date.getDay() (0 = Sunday … 6 = Saturday): lookup is
// weeklyOpens[zonedDate.getDay()]. Keys are explicit so each line asserts its own
// day — a positional list would be silently reorderable.
type SessionOpen = {
  at: string // 'HH:MM' in the venue's local time
  opens: TwentyfourFiveMarketStatus
  endsAt: string // 'HH:MM' local — when this session ends (the next session's start)
  endDayOffset?: number // endsAt is this many days after the open day (default 0)
}

type FallbackSchedule = {
  timezone: string
  weeklyOpens: Partial<Record<number, SessionOpen[]>>
}

// NYSE (America/New_York) session times — each constant defined once so no time
// literal is duplicated across days.
const NYSE_PRE_MARKET_OPEN: SessionOpen = {
  at: '04:00',
  opens: TwentyfourFiveMarketStatus.PRE_MARKET,
  endsAt: '09:30',
}
const NYSE_REGULAR_OPEN: SessionOpen = {
  at: '09:30',
  opens: TwentyfourFiveMarketStatus.REGULAR,
  endsAt: '16:00',
}
const NYSE_POST_MARKET_OPEN: SessionOpen = {
  at: '16:00',
  opens: TwentyfourFiveMarketStatus.POST_MARKET,
  endsAt: '20:00',
}
const NYSE_OVERNIGHT_OPEN: SessionOpen = {
  at: '20:00',
  opens: TwentyfourFiveMarketStatus.OVERNIGHT,
  endsAt: '04:00', // runs to the next day's pre-market open
  endDayOffset: 1,
}

const NYSE_WEEKDAY_OPENS: SessionOpen[] = [
  NYSE_PRE_MARKET_OPEN,
  NYSE_REGULAR_OPEN,
  NYSE_POST_MARKET_OPEN,
  NYSE_OVERNIGHT_OPEN,
]

const FALLBACK_SESSION_SCHEDULE: Record<string, FallbackSchedule> = {
  // Mirrors the nyse/24/5 structure from tradinghours: overnight sessions open 20:00
  // Sun–Thu (running to 04:00); on Friday the post-market end (20:00 ET) opens the
  // weekend closed span — an absence of phases, same as the upstream model.
  nyse: {
    timezone: 'America/New_York',
    weeklyOpens: {
      0: [NYSE_OVERNIGHT_OPEN], // 0:Sunday
      1: NYSE_WEEKDAY_OPENS, // 1:Monday
      2: NYSE_WEEKDAY_OPENS, // 2:Tuesday
      3: NYSE_WEEKDAY_OPENS, // 3:Wednesday
      4: NYSE_WEEKDAY_OPENS, // 4:Thursday
      // 5:Friday — no 20:00 overnight open: the market closes into the weekend.
      5: [NYSE_PRE_MARKET_OPEN, NYSE_REGULAR_OPEN, NYSE_POST_MARKET_OPEN],
      6: [], // 6:Saturday
    },
  },
}

// Per-marketType views over the single per-market schedule, preserving pre-flatten
// behavior exactly: nyse/regular callers never gate on extended or overnight
// sessions. 24/5 and 24/7 share the full four-session view (the 24/7 closed-span
// start is derived from phase ends, not a WEEKEND entry). A market/type outside
// this map cannot be gated at all — callers fail closed (unchanged).
const FULL_SESSION_VIEW = [
  TwentyfourFiveMarketStatus.PRE_MARKET,
  TwentyfourFiveMarketStatus.REGULAR,
  TwentyfourFiveMarketStatus.POST_MARKET,
  TwentyfourFiveMarketStatus.OVERNIGHT,
]
const TYPE_STATUS_VIEWS: Record<string, TwentyfourFiveMarketStatus[]> = {
  regular: [TwentyfourFiveMarketStatus.REGULAR],
  '24/5': FULL_SESSION_VIEW,
  '24/7': FULL_SESSION_VIEW,
}

// Keyed on the market (flattened per-market schedule) plus a known
// marketType view. Lowercased for lookup — a silent miss here fails gating closed,
// so the key match should be forgiving.
const getFallbackEntry = (market: string, marketType: string): FallbackSchedule | undefined =>
  TYPE_STATUS_VIEWS[marketType.toLowerCase()]
    ? FALLBACK_SESSION_SCHEDULE[market.toLowerCase()]
    : undefined

// The timezone gating should use for a market (tradinghours fetch + fallback
// evaluation), independent of the request's sessionBoundariesTimeZone.
export const getGatingTimezone = (market: string, marketType: string): string | undefined =>
  getFallbackEntry(market, marketType)?.timezone

// Labeled session-open transitions (with ends) for the days surrounding nowMs, or
// undefined when the market has no hard-coded entry. Day offsets -2..+1 cover at
// least tradinghours' rolling [now-1d, now+1d] window: at Saturday 00:00–04:00 ET
// the current overnight session opened Thursday 20:00, which -1..+1 (Fri/Sat/Sun)
// cannot see — Friday has no overnight open and Saturday has none at all — so the
// narrower window failed closed while tradinghours still resolved the session. The
// same reach keeps Friday's WEEKEND open visible through the whole weekend.
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
      if (!TYPE_STATUS_VIEWS[marketType.toLowerCase()].includes(open.opens)) {
        continue
      }
      const [hour, minute] = open.at.split(':').map(Number)
      const [endHour, endMinute] = open.endsAt.split(':').map(Number)
      const endDayOffset = open.endDayOffset ?? 0
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
        endTimeMs: new TZDate(
          day.getFullYear(),
          day.getMonth(),
          day.getDate() + endDayOffset,
          endHour,
          endMinute,
          0,
          0,
          entry.timezone,
        ).getTime(),
      })
    }
  }

  return transitions
}
