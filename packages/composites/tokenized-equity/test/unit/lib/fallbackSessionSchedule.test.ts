import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { getFallbackSessionTransitions } from '../../../src/lib/session/fallbackSessionSchedule'
import { SessionTransition } from '../../../src/lib/session/tradingHoursSession'

// Tests for the hard-coded fallback session schedule (DF-28181): gating's labeled
// last-resort schedule when tradinghours is unavailable or unusable. Keyed by
// market/type; initially nyse/24/5 only. Never derived from sessionBoundaries.

const at = (iso: string) => new Date(iso).getTime()

// The function materializes a ±1 day window around `nowMs` (all gating needs is the
// current session's start), so each test queries from a time adjacent to the days it
// asserts on. 2024-01-07 is a Sunday; January is EST = UTC-5.

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
    // Query from Saturday → window covers Fri–Sun. Friday 2024-01-12 20:00 ET
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
    expect(
      getFallbackSessionTransitions('nyse', 'regular', at('2024-01-10T12:00:00.000Z')),
    ).toBeUndefined()
  })

  it('is case-insensitive on the market (tradinghours accepts NYSE)', () => {
    expect(
      getFallbackSessionTransitions('NYSE', '24/5', at('2024-01-10T12:00:00.000Z')),
    ).toBeDefined()
  })
})
