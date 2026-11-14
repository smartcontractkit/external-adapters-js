import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

import { getFallbackSessionTransitions } from '../../../src/lib/session/fallbackSessionSchedule'
import {
  closedSpanStartMs,
  gateIssuer247Report,
  gatingStatusesFor247,
} from '../../../src/lib/session/issuer247Gating'
import { SessionTransition } from '../../../src/lib/session/tradingHoursSession'

// The gate logs through the framework's makeLogger. PlaceholderLogger resolves the
// factory lazily on first log call, so installing a spy factory in beforeAll
// captures the gate's warnings without module mocks — letting the fail-open test
// assert the escape hatch is never silent (TDD §5).
const warnSpy = jest.fn()
const silent = jest.fn()

// Tests for the 24/7 (issuer-price-247) session-start gate — TDD:
// docs/issuer-247-session-start-gating-tdd.md, ADR-0007. The report's own
// marketStatus declares its session; the gate rejects (503, zero tolerance) a
// report whose lastSeenTimestampNs predates that session's start. WEEKEND/closed
// reports gate against the start of the current closed span: the endTime of the
// last trading phase before the gap (tradinghours ADR-0001), or the explicit
// WEEKEND open in the flattened fallback schedule.
//
// All times below are UTC unless noted; the ET equivalents are in comments.

const ns = (iso: string): string => (BigInt(new Date(iso).getTime()) * 10n ** 6n).toString()

const t = (
  status: TwentyfourFiveMarketStatus,
  time: string,
  endTime?: string,
): SessionTransition => ({
  status,
  timeMs: new Date(time).getTime(),
  // SessionTransition gains an optional endTimeMs (tradinghours ADR-0001 passthrough);
  // transitions from a pre-endTime tradinghours simply lack it.
  ...(endTime !== undefined ? { endTimeMs: new Date(endTime).getTime() } : {}),
})

// A normal week's transitions, as tradinghours would return them (no WEEKEND —
// closures are an absence of phases): Friday 2024-01-05 (ET) sessions through
// Sunday 2024-01-07 overnight open.
const FRIDAY_POST_END_UTC = '2024-01-06T01:00:00.000Z' // Fri 20:00 ET
const NORMAL_WEEK: SessionTransition[] = [
  t(TwentyfourFiveMarketStatus.PRE_MARKET, '2024-01-05T09:00:00.000Z', '2024-01-05T14:30:00.000Z'), // Fri 04:00–09:30 ET
  t(TwentyfourFiveMarketStatus.REGULAR, '2024-01-05T14:30:00.000Z', '2024-01-05T21:00:00.000Z'), // Fri 09:30–16:00 ET
  t(TwentyfourFiveMarketStatus.POST_MARKET, '2024-01-05T21:00:00.000Z', FRIDAY_POST_END_UTC), // Fri 16:00–20:00 ET
  t(TwentyfourFiveMarketStatus.OVERNIGHT, '2024-01-08T01:00:00.000Z', '2024-01-08T09:00:00.000Z'), // Sun 20:00 ET → Mon 04:00 ET
  t(TwentyfourFiveMarketStatus.PRE_MARKET, '2024-01-08T09:00:00.000Z', '2024-01-08T14:30:00.000Z'), // Mon 04:00 ET
  t(TwentyfourFiveMarketStatus.REGULAR, '2024-01-08T14:30:00.000Z', '2024-01-08T21:00:00.000Z'), // Mon 09:30 ET
]

const NOW_SATURDAY = new Date('2024-01-06T15:00:00.000Z').getTime() // Sat 10:00 ET
const NOW_FRIDAY_EVENING = new Date('2024-01-05T23:00:00.000Z').getTime() // Fri 18:00 ET

describe('gatingStatusesFor247', () => {
  it('maps the report marketStatus to the status set that opens its session', () => {
    expect(gatingStatusesFor247(TwentyfourFiveMarketStatus.REGULAR)).toEqual([
      TwentyfourFiveMarketStatus.REGULAR,
    ])
    // PRE and POST belong to the continuous extended session that opens at 04:00 ET
    expect(gatingStatusesFor247(TwentyfourFiveMarketStatus.PRE_MARKET)).toEqual([
      TwentyfourFiveMarketStatus.PRE_MARKET,
    ])
    expect(gatingStatusesFor247(TwentyfourFiveMarketStatus.POST_MARKET)).toEqual([
      TwentyfourFiveMarketStatus.PRE_MARKET,
    ])
    expect(gatingStatusesFor247(TwentyfourFiveMarketStatus.OVERNIGHT)).toEqual([
      TwentyfourFiveMarketStatus.OVERNIGHT,
    ])
  })

  it('treats WEEKEND as a closed-span report (no opening status — gated by closedSpanStartMs)', () => {
    expect(gatingStatusesFor247(TwentyfourFiveMarketStatus.WEEKEND)).toBeUndefined()
  })

  it('treats UNKNOWN (and unmapped values) as indeterminate', () => {
    expect(gatingStatusesFor247(TwentyfourFiveMarketStatus.UNKNOWN)).toBeUndefined()
    expect(gatingStatusesFor247(99 as TwentyfourFiveMarketStatus)).toBeUndefined()
  })
})

describe('closedSpanStartMs', () => {
  it('derives the weekend start from the endTime of the last transition before the gap', () => {
    // Saturday: the last transition is Friday's post-market; its end (Fri 20:00 ET)
    // is the closed-span start.
    expect(closedSpanStartMs(NORMAL_WEEK, NOW_SATURDAY)).toBe(
      new Date(FRIDAY_POST_END_UTC).getTime(),
    )
  })

  it('handles a midweek holiday: closed span opens at the last post-market end (Wed 20:00 ET)', () => {
    // Thanksgiving-style: Wednesday post-market ends 20:00 ET, no phases Thursday,
    // next phase is Friday pre-market.
    const holidayWeek: SessionTransition[] = [
      t(TwentyfourFiveMarketStatus.REGULAR, '2024-11-27T14:30:00.000Z', '2024-11-27T21:00:00.000Z'), // Wed 09:30–16:00 ET
      t(
        TwentyfourFiveMarketStatus.POST_MARKET,
        '2024-11-27T21:00:00.000Z',
        '2024-11-28T01:00:00.000Z',
      ), // Wed 16:00–20:00 ET
      // Thursday (Thanksgiving): no phases
      t(
        TwentyfourFiveMarketStatus.PRE_MARKET,
        '2024-11-29T09:00:00.000Z',
        '2024-11-29T14:30:00.000Z',
      ), // Fri 04:00 ET
    ]
    const nowThanksgiving = new Date('2024-11-28T17:00:00.000Z').getTime() // Thu noon ET

    expect(closedSpanStartMs(holidayWeek, nowThanksgiving)).toBe(
      new Date('2024-11-28T01:00:00.000Z').getTime(), // Wed 20:00 ET
    )
  })

  it('is undefined when no transition is at or before now', () => {
    expect(
      closedSpanStartMs(NORMAL_WEEK, new Date('2024-01-01T00:00:00.000Z').getTime()),
    ).toBeUndefined()
  })

  it('is undefined when transitions lack endTimeMs (pre-endTime tradinghours)', () => {
    const withoutEnds: SessionTransition[] = [
      t(TwentyfourFiveMarketStatus.POST_MARKET, '2024-01-05T21:00:00.000Z'),
    ]
    expect(closedSpanStartMs(withoutEnds, NOW_SATURDAY)).toBeUndefined()
  })
})

describe('gateIssuer247Report', () => {
  beforeAll(() => {
    LoggerFactoryProvider.set({
      child: () => ({
        warn: warnSpy,
        error: silent,
        info: silent,
        debug: silent,
        fatal: silent,
        trace: silent,
      }),
    })
  })

  beforeEach(() => {
    warnSpy.mockClear()
  })

  // Convenience wrapper around gateIssuer247Report: fills in the shared fixtures
  // (NORMAL_WEEK tradinghours transitions, failOnIndeterminate on, ISO string → ns)
  // so each test reads as just (marketStatus, lastSeen, now) plus any overrides.
  const gate = (
    marketStatus: TwentyfourFiveMarketStatus,
    lastSeen: string,
    nowMs: number,
    overrides: Partial<Parameters<typeof gateIssuer247Report>[0]> = {},
  ) =>
    gateIssuer247Report({
      marketStatus,
      lastSeenTimestampNs: ns(lastSeen),
      nowMs,
      transitions: NORMAL_WEEK,
      failOnIndeterminate: true,
      ...overrides,
    })

  // Asserts that fn rejects with the gate's pre-session 503: an AdapterError with
  // statusCode 503 and the established message shape "Market data predates session
  // start: … PRE_SESSION(<STATUS>…)" — the same conventions as 24/5 gating.
  const expectPreSession = (fn: () => unknown, status: string) => {
    let error: AdapterError | undefined
    try {
      fn()
    } catch (e) {
      error = e as AdapterError
    }
    expect(error).toBeInstanceOf(AdapterError)
    expect(error?.statusCode).toBe(503)
    expect(error?.message).toContain('Market data predates session start')
    expect(error?.message).toContain(`PRE_SESSION(${status}`)
  }

  describe('regular sessions (zero tolerance, mirroring 24/5)', () => {
    const NOW_MONDAY_REGULAR = new Date('2024-01-08T15:00:00.000Z').getTime() // Mon 10:00 ET

    it('passes an in-session report and attributes the schedule source', () => {
      expect(
        gate(TwentyfourFiveMarketStatus.REGULAR, '2024-01-08T15:00:00.000Z', NOW_MONDAY_REGULAR),
      ).toEqual({
        gatingSessionSource: 'TRADINGHOURS',
      })
    })

    it('rejects a report timestamped just before the regular open, even if fresh by age', () => {
      // Served 10:00 ET Monday, stamped 09:29:59 ET — a Friday leftover / warm-up print.
      expectPreSession(
        () =>
          gate(TwentyfourFiveMarketStatus.REGULAR, '2024-01-08T14:29:59.000Z', NOW_MONDAY_REGULAR),
        'REGULAR',
      )
    })

    it('admits a report timestamped exactly at the session start (zero tolerance boundary)', () => {
      expect(
        gate(TwentyfourFiveMarketStatus.REGULAR, '2024-01-08T14:30:00.000Z', NOW_MONDAY_REGULAR),
      ).toEqual({ gatingSessionSource: 'TRADINGHOURS' })
    })

    it('gates PRE_MARKET and POST_MARKET reports against the 04:00 ET pre-market open', () => {
      const mondayPreMarket = new Date('2024-01-08T10:00:00.000Z').getTime() // Mon 05:00 ET
      // Stamped 03:59:59 ET — before the extended session opened.
      expectPreSession(
        () =>
          gate(TwentyfourFiveMarketStatus.PRE_MARKET, '2024-01-08T08:59:59.000Z', mondayPreMarket),
        'PRE_MARKET',
      )
      expect(
        gate(TwentyfourFiveMarketStatus.POST_MARKET, '2024-01-08T09:00:00.000Z', mondayPreMarket),
      ).toEqual({ gatingSessionSource: 'TRADINGHOURS' })
    })
  })

  describe('WEEKEND reports gate against the closed-span start', () => {
    it('passes a Saturday report stamped after the Friday 20:00 ET close', () => {
      expect(
        gate(TwentyfourFiveMarketStatus.WEEKEND, '2024-01-06T14:00:00.000Z', NOW_SATURDAY),
      ).toEqual({
        gatingSessionSource: 'TRADINGHOURS',
      })
    })

    it('rejects a weekend-served report stamped before the Friday close (previous-session leftover)', () => {
      // Served Saturday, stamped Friday 17:59 ET — before the closed span opened at 20:00 ET.
      expectPreSession(
        () => gate(TwentyfourFiveMarketStatus.WEEKEND, '2024-01-05T22:59:00.000Z', NOW_SATURDAY),
        'WEEKEND',
      )
    })

    it('admits a report stamped exactly at the closed-span start', () => {
      expect(gate(TwentyfourFiveMarketStatus.WEEKEND, FRIDAY_POST_END_UTC, NOW_SATURDAY)).toEqual({
        gatingSessionSource: 'TRADINGHOURS',
      })
    })
  })

  describe('fallback schedule (tradinghours unusable)', () => {
    it('uses fallbackTransitions when the tradinghours schedule is absent, with source FALLBACK', () => {
      const fallbackTransitions = getFallbackSessionTransitions('nyse', '24/7', NOW_SATURDAY)
      expect(fallbackTransitions).toBeDefined()

      expect(
        gate(TwentyfourFiveMarketStatus.WEEKEND, '2024-01-06T14:00:00.000Z', NOW_SATURDAY, {
          transitions: undefined,
          fallbackTransitions,
        }),
      ).toEqual({ gatingSessionSource: 'FALLBACK' })
    })
  })

  describe('indeterminate sessions and the fail-on-indeterminate flag', () => {
    it('fails closed (503 Session start unknown) on UNKNOWN marketStatus when the flag is on', () => {
      let error: AdapterError | undefined
      try {
        gate(TwentyfourFiveMarketStatus.UNKNOWN, '2024-01-06T14:00:00.000Z', NOW_SATURDAY)
      } catch (e) {
        error = e as AdapterError
      }
      expect(error?.statusCode).toBe(503)
      expect(error?.message).toContain('Session start unknown')
    })

    it('fails closed when the session start is unresolvable (WEEKEND report, transitions without endTimeMs, no fallback)', () => {
      let error: AdapterError | undefined
      try {
        gate(TwentyfourFiveMarketStatus.WEEKEND, '2024-01-06T14:00:00.000Z', NOW_SATURDAY, {
          transitions: [t(TwentyfourFiveMarketStatus.POST_MARKET, '2024-01-05T21:00:00.000Z')],
          fallbackTransitions: undefined,
        })
      } catch (e) {
        error = e as AdapterError
      }
      expect(error?.statusCode).toBe(503)
      expect(error?.message).toContain('Session start unknown')
    })

    it('serves the report (with a warning) when failOnIndeterminate is false', () => {
      expect(
        gate(TwentyfourFiveMarketStatus.UNKNOWN, '2024-01-06T14:00:00.000Z', NOW_SATURDAY, {
          failOnIndeterminate: false,
        }),
      ).toEqual({ gatingSessionSource: undefined })
      // The escape hatch is never silent (TDD §5): fail-open serves must log a warning.
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Session start unknown'))
    })
  })

  describe('marketSessionOverride test hook', () => {
    // Mirrors the 24/5 hook: the gate resolves the NEXT start of the named session
    // (tradinghours transitions only — the fallback is never consulted), so any live
    // report deterministically predates it and exercises the genuine PRE_SESSION
    // rejection path in staging.
    it('forces the genuine PRE_SESSION rejection against the next session start, with the override marker', () => {
      // Friday evening: the next REGULAR start (Monday 09:30 ET) is strictly after
      // now, so the live Friday report deterministically predates it.
      let error: AdapterError | undefined
      try {
        gate(TwentyfourFiveMarketStatus.REGULAR, '2024-01-05T22:00:00.000Z', NOW_FRIDAY_EVENING, {
          marketSessionOverride: TwentyfourFiveMarketStatus.REGULAR,
        })
      } catch (e) {
        error = e as AdapterError
      }
      expect(error?.statusCode).toBe(503)
      expect(error?.message).toContain('Market data predates session start')
      expect(error?.message).toContain('[marketSessionOverride=REGULAR]')
    })

    it('never consults the fallback schedule: no future tradinghours transition → Session start unknown', () => {
      let error: AdapterError | undefined
      try {
        gate(
          TwentyfourFiveMarketStatus.REGULAR,
          '2024-01-08T15:00:00.000Z',
          new Date('2024-01-08T15:00:00.000Z').getTime(),
          {
            // NORMAL_WEEK's last REGULAR start is Monday 14:30 UTC — now is after it
            marketSessionOverride: TwentyfourFiveMarketStatus.REGULAR,
            fallbackTransitions: getFallbackSessionTransitions('nyse', '24/7', NOW_SATURDAY),
          },
        )
      } catch (e) {
        error = e as AdapterError
      }
      expect(error?.statusCode).toBe(503)
      expect(error?.message).toContain('Session start unknown')
    })

    it('without the override, an identical request passes (the hook is the only difference)', () => {
      const nowMs = new Date('2024-01-08T15:00:00.000Z').getTime()
      expect(gate(TwentyfourFiveMarketStatus.REGULAR, '2024-01-08T15:00:00.000Z', nowMs)).toEqual({
        gatingSessionSource: 'TRADINGHOURS',
      })
    })
  })

  describe('malformed provider timestamps', () => {
    it('rejects with 503 (not an unguarded exception) when lastSeenTimestampNs is malformed', () => {
      let error: AdapterError | undefined
      try {
        gateIssuer247Report({
          marketStatus: TwentyfourFiveMarketStatus.REGULAR,
          lastSeenTimestampNs: 'not-a-number',
          nowMs: NOW_FRIDAY_EVENING,
          transitions: NORMAL_WEEK,
          failOnIndeterminate: true,
        })
      } catch (e) {
        error = e as AdapterError
      }
      expect(error?.statusCode).toBe(503)
      expect(error?.message).toContain('Malformed lastSeenTimestampNs')
    })
  })
})
