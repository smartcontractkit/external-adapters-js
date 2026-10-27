import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { evaluateSessionGate } from '../../../src/lib/session/sessionGate'
import type { SessionContext, SessionEvent } from '../../../src/lib/session/types'

const at = (iso: string): number => Date.parse(iso)
const ts = (iso: string): string => (BigInt(at(iso)) * 1_000_000n).toString()

const MONDAY: SessionEvent[] = [
  { status: TwentyfourFiveMarketStatus.PRE_MARKET, startMs: at('2024-01-15T04:00:00Z') },
  { status: TwentyfourFiveMarketStatus.REGULAR, startMs: at('2024-01-15T09:30:00Z') },
  { status: TwentyfourFiveMarketStatus.POST_MARKET, startMs: at('2024-01-15T16:00:00Z') },
  { status: TwentyfourFiveMarketStatus.OVERNIGHT, startMs: at('2024-01-15T20:00:00Z') },
]

const session = (overrides: Partial<SessionContext> = {}): SessionContext => ({
  secondsFromTransition: 0,
  source: 'TRADINGHOURS',
  events: MONDAY,
  expectedStatus: TwentyfourFiveMarketStatus.PRE_MARKET,
  weekend: '520-020:UTC',
  ...overrides,
})

const report = (marketStatus: TwentyfourFiveMarketStatus, iso: string) => ({
  marketStatus,
  lastSeenTimestampNs: ts(iso),
})

describe('evaluateSessionGate', () => {
  describe('tradinghours schedule', () => {
    it('accepts a pre-market report at the scheduled start', () => {
      const decision = evaluateSessionGate({
        report: report(TwentyfourFiveMarketStatus.PRE_MARKET, '2024-01-15T04:00:12Z'),
        session: session({ expectedStatus: TwentyfourFiveMarketStatus.PRE_MARKET }),
        nowMs: at('2024-01-15T04:00:15Z'),
      })

      expect(decision.eligible).toBe(true)
    })

    it('rejects pre-open warm-up data', () => {
      const decision = evaluateSessionGate({
        report: report(TwentyfourFiveMarketStatus.PRE_MARKET, '2024-01-15T03:59:59Z'),
        session: session({ expectedStatus: TwentyfourFiveMarketStatus.PRE_MARKET }),
        nowMs: at('2024-01-15T04:00:15Z'),
      })

      expect(decision).toMatchObject({ eligible: false })
      expect((decision as { reason: string }).reason).toContain('predates PRE_MARKET session start')
    })

    it('accepts a regular report at the scheduled start', () => {
      const decision = evaluateSessionGate({
        report: report(TwentyfourFiveMarketStatus.REGULAR, '2024-01-15T09:30:12Z'),
        session: session({ expectedStatus: TwentyfourFiveMarketStatus.REGULAR }),
        nowMs: at('2024-01-15T09:30:15Z'),
      })

      expect(decision.eligible).toBe(true)
    })

    it('rejects regular warm-up data', () => {
      const decision = evaluateSessionGate({
        report: report(TwentyfourFiveMarketStatus.REGULAR, '2024-01-15T09:29:59Z'),
        session: session({ expectedStatus: TwentyfourFiveMarketStatus.REGULAR }),
        nowMs: at('2024-01-15T09:30:15Z'),
      })

      expect(decision.eligible).toBe(false)
    })

    it('accepts a post-market report at the scheduled start', () => {
      const decision = evaluateSessionGate({
        report: report(TwentyfourFiveMarketStatus.POST_MARKET, '2024-01-15T16:00:12Z'),
        session: session({ expectedStatus: TwentyfourFiveMarketStatus.POST_MARKET }),
        nowMs: at('2024-01-15T16:00:15Z'),
      })

      expect(decision.eligible).toBe(true)
    })

    it('rejects post-market warm-up data', () => {
      const decision = evaluateSessionGate({
        report: report(TwentyfourFiveMarketStatus.POST_MARKET, '2024-01-15T15:59:59Z'),
        session: session({ expectedStatus: TwentyfourFiveMarketStatus.POST_MARKET }),
        nowMs: at('2024-01-15T16:00:15Z'),
      })

      expect(decision.eligible).toBe(false)
    })

    it('accepts an overnight report at the scheduled start', () => {
      const decision = evaluateSessionGate({
        report: report(TwentyfourFiveMarketStatus.OVERNIGHT, '2024-01-15T20:00:12Z'),
        session: session({ expectedStatus: TwentyfourFiveMarketStatus.OVERNIGHT }),
        nowMs: at('2024-01-15T20:00:15Z'),
      })

      expect(decision.eligible).toBe(true)
    })

    it('rejects a report from the previous session at the overnight start', () => {
      const decision = evaluateSessionGate({
        report: report(TwentyfourFiveMarketStatus.POST_MARKET, '2024-01-15T19:59:59Z'),
        session: session({ expectedStatus: TwentyfourFiveMarketStatus.OVERNIGHT }),
        nowMs: at('2024-01-15T20:00:15Z'),
      })

      expect(decision).toMatchObject({ eligible: false })
      expect((decision as { reason: string }).reason).toContain(
        'report is for POST_MARKET but OVERNIGHT is expected',
      )
    })

    it('rejects every report while the market is closed for the weekend', () => {
      const decision = evaluateSessionGate({
        report: report(TwentyfourFiveMarketStatus.POST_MARKET, '2024-01-19T16:05:00Z'),
        session: session({
          expectedStatus: TwentyfourFiveMarketStatus.WEEKEND,
          events: [
            { status: TwentyfourFiveMarketStatus.POST_MARKET, startMs: at('2024-01-19T16:00:00Z') },
            { status: TwentyfourFiveMarketStatus.WEEKEND, startMs: at('2024-01-19T20:00:00Z') },
          ],
        }),
        nowMs: at('2024-01-20T12:00:00Z'),
      })

      expect(decision).toMatchObject({ eligible: false })
      expect((decision as { reason: string }).reason).toContain('market is closed')
    })

    it('rejects when tradinghours and the schedule disagree about the session', () => {
      const decision = evaluateSessionGate({
        report: report(TwentyfourFiveMarketStatus.REGULAR, '2024-01-15T09:30:12Z'),
        session: session({ expectedStatus: TwentyfourFiveMarketStatus.PRE_MARKET }),
        nowMs: at('2024-01-15T09:30:15Z'),
      })

      expect(decision).toMatchObject({ eligible: false })
      expect((decision as { reason: string }).reason).toContain(
        'schedule is in REGULAR but market status is PRE_MARKET',
      )
    })

    it('rejects when the expected status is UNKNOWN', () => {
      const decision = evaluateSessionGate({
        report: report(TwentyfourFiveMarketStatus.PRE_MARKET, '2024-01-15T04:00:12Z'),
        session: session({ expectedStatus: TwentyfourFiveMarketStatus.UNKNOWN }),
        nowMs: at('2024-01-15T04:00:15Z'),
      })

      expect(decision.eligible).toBe(false)
    })

    it('accepts a Sunday reopen report and rejects a Friday report', () => {
      const events: SessionEvent[] = [
        { status: TwentyfourFiveMarketStatus.POST_MARKET, startMs: at('2024-01-19T16:00:00Z') },
        { status: TwentyfourFiveMarketStatus.OVERNIGHT, startMs: at('2024-01-21T20:00:00Z') },
      ]

      const accepted = evaluateSessionGate({
        report: report(TwentyfourFiveMarketStatus.OVERNIGHT, '2024-01-21T20:00:12Z'),
        session: session({
          events,
          expectedStatus: TwentyfourFiveMarketStatus.OVERNIGHT,
        }),
        nowMs: at('2024-01-21T20:00:15Z'),
      })
      expect(accepted.eligible).toBe(true)

      const rejected = evaluateSessionGate({
        report: report(TwentyfourFiveMarketStatus.OVERNIGHT, '2024-01-19T19:59:59Z'),
        session: session({
          events,
          expectedStatus: TwentyfourFiveMarketStatus.OVERNIGHT,
        }),
        nowMs: at('2024-01-21T20:00:15Z'),
      })
      expect(rejected.eligible).toBe(false)
    })

    it('rejects when no session start is known', () => {
      const decision = evaluateSessionGate({
        report: report(TwentyfourFiveMarketStatus.PRE_MARKET, '2024-01-15T04:00:12Z'),
        session: session({ events: [] }),
        nowMs: at('2024-01-15T04:00:15Z'),
      })

      expect(decision.eligible).toBe(false)
    })

    it('rejects a report without a valid timestamp', () => {
      const decision = evaluateSessionGate({
        report: {
          marketStatus: TwentyfourFiveMarketStatus.PRE_MARKET,
          lastSeenTimestampNs: 'not-a-number',
        },
        session: session(),
        nowMs: at('2024-01-15T04:00:15Z'),
      })

      expect(decision.eligible).toBe(false)
    })
  })

  describe('fallback schedule', () => {
    const fallback = (): SessionContext =>
      session({
        source: 'FALLBACK',
        expectedStatus: undefined,
        events: [
          { status: TwentyfourFiveMarketStatus.UNKNOWN, startMs: at('2024-01-15T16:00:00Z') },
        ],
      })

    it('accepts a report after the fallback boundary', () => {
      const decision = evaluateSessionGate({
        report: report(TwentyfourFiveMarketStatus.POST_MARKET, '2024-01-15T16:00:12Z'),
        session: fallback(),
        nowMs: at('2024-01-15T16:00:15Z'),
      })

      expect(decision.eligible).toBe(true)
    })

    it('rejects a report before the fallback boundary', () => {
      const decision = evaluateSessionGate({
        report: report(TwentyfourFiveMarketStatus.POST_MARKET, '2024-01-15T15:59:59Z'),
        session: fallback(),
        nowMs: at('2024-01-15T16:00:15Z'),
      })

      expect(decision.eligible).toBe(false)
    })
  })
})
