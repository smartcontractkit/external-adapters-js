import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import {
  getFallbackSessionTransitions,
  getGatingTimezone,
} from '../../../src/lib/session/fallbackSessionSchedule'
import { SessionTransition } from '../../../src/lib/session/tradingHoursSession'

// Tests for the hard-coded fallback session schedule: gating's labeled last-resort
// schedule when tradinghours is unavailable or unusable. Keyed by market/type;
// nyse/24/5 (full 24/5 session structure) and nyse/regular (regular-hours only).
// Never derived from sessionBoundaries.

const at = (iso: string) => new Date(iso).getTime()

// The function materializes a -2..+1 day window around `nowMs` (covering tradinghours'
// rolling [now-1d, now+1d] window), so each test queries from a time adjacent to the
// days it asserts on. 2024-01-07 is a Sunday; January is EST = UTC-5.

describe('getFallbackSessionTransitions', () => {
  it('returns labeled transitions for nyse/24/5 with the true 09:30 ET regular open', () => {
    // Query from Tuesday → window covers Mon–Wed.
    const transitions = getFallbackSessionTransitions(
      'nyse',
      '24/5',
      at('2024-01-09T12:00:00.000Z'),
    )

    expect(transitions).toBeDefined()
    // Monday 2024-01-08: REGULAR opens 09:30 ET = 14:30 UTC (EST)
    expect(transitions).toContainEqual({
      status: TwentyfourFiveMarketStatus.REGULAR,
      timeMs: at('2024-01-08T14:30:00.000Z'),
    })
    // Monday PRE_MARKET 04:00 ET = 09:00 UTC; POST_MARKET 16:00 ET = 21:00 UTC
    expect(transitions).toContainEqual({
      status: TwentyfourFiveMarketStatus.PRE_MARKET,
      timeMs: at('2024-01-08T09:00:00.000Z'),
    })
    expect(transitions).toContainEqual({
      status: TwentyfourFiveMarketStatus.POST_MARKET,
      timeMs: at('2024-01-08T21:00:00.000Z'),
    })
    // Monday OVERNIGHT 20:00 ET = Tuesday 01:00 UTC
    expect(transitions).toContainEqual({
      status: TwentyfourFiveMarketStatus.OVERNIGHT,
      timeMs: at('2024-01-09T01:00:00.000Z'),
    })
  })

  it('includes the Sunday 20:00 ET overnight open (which the smoother fallback skips)', () => {
    // Query from Monday → window covers Sun–Tue.
    const transitions = getFallbackSessionTransitions(
      'nyse',
      '24/5',
      at('2024-01-08T12:00:00.000Z'),
    )

    // Sunday 2024-01-07 20:00 ET = Monday 01:00 UTC
    expect(transitions).toContainEqual({
      status: TwentyfourFiveMarketStatus.OVERNIGHT,
      timeMs: at('2024-01-08T01:00:00.000Z'),
    })
  })

  it('has no Friday 20:00 overnight open (Friday 20:00 ET → weekend)', () => {
    // Query from Saturday → window covers Thu–Sun. Friday 2024-01-12 20:00 ET
    // (Sat 01:00 UTC) must have no overnight open…
    const result = getFallbackSessionTransitions('nyse', '24/5', at('2024-01-13T12:00:00.000Z'))
    expect(result).toBeDefined()
    const transitions = result as SessionTransition[]

    expect(transitions).not.toContainEqual({
      status: TwentyfourFiveMarketStatus.OVERNIGHT,
      timeMs: at('2024-01-13T01:00:00.000Z'),
    })
    // …while the Sunday 20:00 ET overnight open (Mon 01:00 UTC) is present, and Friday
    // still has its daytime sessions.
    expect(transitions).toContainEqual({
      status: TwentyfourFiveMarketStatus.OVERNIGHT,
      timeMs: at('2024-01-15T01:00:00.000Z'),
    })
    expect(transitions).toContainEqual({
      status: TwentyfourFiveMarketStatus.POST_MARKET,
      timeMs: at('2024-01-12T21:00:00.000Z'),
    })
  })

  it('resolves the Thursday 20:00 overnight open on Saturday 00:00–04:00 ET', () => {
    // Regression: during the Saturday overnight session (opened Thursday 20:00 ET),
    // a -1..+1 window sees only Fri/Sat/Sun — Friday has no overnight open and
    // Saturday has none — so the fallback found no past OVERNIGHT transition and
    // failed closed (503) while tradinghours' rolling [now-1d, now+1d] window still
    // resolved the session. The -2..+1 window must reach Thursday 20:00 ET
    // (= Friday 2024-01-12 01:00 UTC) at every hour of that window.
    for (const queryIso of [
      '2024-01-13T05:00:00.000Z', // Sat 00:00 ET
      '2024-01-13T07:00:00.000Z', // Sat 02:00 ET
      '2024-01-13T08:59:00.000Z', // Sat 03:59 ET
    ]) {
      const result = getFallbackSessionTransitions('nyse', '24/5', at(queryIso))
      expect(result).toBeDefined()
      expect(result as SessionTransition[]).toContainEqual({
        status: TwentyfourFiveMarketStatus.OVERNIGHT,
        timeMs: at('2024-01-12T01:00:00.000Z'), // Thursday 20:00 ET
      })
    }
  })

  it('resolves ET wall-clock times correctly across DST', () => {
    // July: EDT = UTC-4, so REGULAR 09:30 ET = 13:30 UTC (not 14:30).
    // Query from Tuesday → window covers Mon–Wed.
    const result = getFallbackSessionTransitions('nyse', '24/5', at('2024-07-09T12:00:00.000Z'))
    expect(result).toBeDefined()
    const transitions = result as SessionTransition[]

    expect(transitions).toContainEqual({
      status: TwentyfourFiveMarketStatus.REGULAR,
      timeMs: at('2024-07-08T13:30:00.000Z'), // Monday 2024-07-08
    })
  })

  it('returns undefined for market/type pairs without a hard-coded entry', () => {
    expect(
      getFallbackSessionTransitions('lse', '24/5', at('2024-01-10T12:00:00.000Z')),
    ).toBeUndefined()
  })

  it('is case-insensitive on the market (tradinghours accepts NYSE)', () => {
    expect(
      getFallbackSessionTransitions('NYSE', '24/5', at('2024-01-10T12:00:00.000Z')),
    ).toBeDefined()
  })
})

describe('getFallbackSessionTransitions - nyse/regular', () => {
  it('returns the 09:30 ET REGULAR open on weekdays', () => {
    // Query from Tuesday → window covers Mon–Wed. January is EST = UTC-5.
    const transitions = getFallbackSessionTransitions(
      'nyse',
      'regular',
      at('2024-01-09T12:00:00.000Z'),
    )

    expect(transitions).toBeDefined()
    // Monday 2024-01-08 and Tuesday 2024-01-09 REGULAR opens: 09:30 ET = 14:30 UTC
    expect(transitions).toContainEqual({
      status: TwentyfourFiveMarketStatus.REGULAR,
      timeMs: at('2024-01-08T14:30:00.000Z'),
    })
    expect(transitions).toContainEqual({
      status: TwentyfourFiveMarketStatus.REGULAR,
      timeMs: at('2024-01-09T14:30:00.000Z'),
    })
  })

  it('contains only REGULAR transitions — no pre/post-market or overnight sessions', () => {
    // Pins the deliberate narrowing vs nyse/24/5: a nyse/regular feed must never gate
    // open on an extended-hours or overnight session from the fallback. Query from
    // Saturday → window covers Thu–Sun, the widest spread of distinct weekdays.
    const result = getFallbackSessionTransitions('nyse', 'regular', at('2024-01-13T12:00:00.000Z'))
    expect(result).toBeDefined()
    const transitions = result as SessionTransition[]

    expect(transitions.length).toBeGreaterThan(0)
    expect(transitions.every((t) => t.status === TwentyfourFiveMarketStatus.REGULAR)).toBe(true)
  })

  it('has no Sunday or Saturday sessions, and Friday has no overnight open', () => {
    // Query from Saturday 2024-01-13 → window covers Thu 11th through Sun 14th.
    const result = getFallbackSessionTransitions('nyse', 'regular', at('2024-01-13T12:00:00.000Z'))
    expect(result).toBeDefined()
    const transitions = result as SessionTransition[]

    // Thursday and Friday REGULAR opens are present…
    expect(transitions).toContainEqual({
      status: TwentyfourFiveMarketStatus.REGULAR,
      timeMs: at('2024-01-11T14:30:00.000Z'),
    })
    expect(transitions).toContainEqual({
      status: TwentyfourFiveMarketStatus.REGULAR,
      timeMs: at('2024-01-12T14:30:00.000Z'),
    })
    // …and there are no transitions at all on Saturday 13th or Sunday 14th ET
    // (Sat 00:00 ET = Sat 05:00 UTC, Sun 23:59 ET = Mon 04:59 UTC).
    const satStartUtc = at('2024-01-13T05:00:00.000Z')
    const sunEndUtc = at('2024-01-15T04:59:59.000Z')
    expect(transitions.filter((t) => t.timeMs >= satStartUtc && t.timeMs <= sunEndUtc)).toEqual([])
  })

  it('resolves the 09:30 ET wall-clock open correctly across DST', () => {
    // July: EDT = UTC-4, so REGULAR 09:30 ET = 13:30 UTC (not 14:30).
    const result = getFallbackSessionTransitions('nyse', 'regular', at('2024-07-09T12:00:00.000Z'))
    expect(result).toBeDefined()

    expect(result as SessionTransition[]).toContainEqual({
      status: TwentyfourFiveMarketStatus.REGULAR,
      timeMs: at('2024-07-08T13:30:00.000Z'), // Monday 2024-07-08
    })
  })

  it('is case-insensitive on the market type segment', () => {
    expect(
      getFallbackSessionTransitions('nyse', 'REGULAR', at('2024-01-10T12:00:00.000Z')),
    ).toBeDefined()
  })
})

describe('getGatingTimezone', () => {
  it('returns America/New_York for both nyse entries', () => {
    expect(getGatingTimezone('nyse', '24/5')).toBe('America/New_York')
    expect(getGatingTimezone('nyse', 'regular')).toBe('America/New_York')
  })

  it('returns undefined for market/type pairs without a hard-coded entry', () => {
    expect(getGatingTimezone('lse', '24/5')).toBeUndefined()
  })
})
