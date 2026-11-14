import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'

import { parseMarketSession } from '../../src/transport/market-session'

// Unit tests for the market-session parser, focused on the additive `endTime`
// passthrough (tradinghours ADR-0001): callers derive the start of a closed span
// (weekend/holiday) from the `end` of the last trading phase before the gap, so
// every emitted transition must carry the upstream phase `end` unchanged.

const phase = (
  phase_type: string,
  phase_name: string,
  start: string,
  end: string,
  status = 'Closed',
) => ({
  phase_type,
  phase_name,
  phase_memo: null,
  status,
  start,
  end,
})

const body = (schedule: ReturnType<typeof phase>[]) => ({
  data: { start: '2022-01-01', end: '2022-01-03', schedule },
})

describe('parseMarketSession', () => {
  describe('endTime passthrough', () => {
    it('carries the upstream phase end as endTime on every mapped transition', () => {
      const result = parseMarketSession(
        body([
          phase('Other', 'Overnight', '2021-12-31T20:00:00-05:00', '2022-01-01T04:00:00-05:00'),
          phase(
            'Pre-Trading Session',
            '',
            '2022-01-01T04:00:00-05:00',
            '2022-01-01T09:30:00-05:00',
          ),
          phase(
            'Primary Trading Session',
            '',
            '2022-01-01T09:30:00-05:00',
            '2022-01-01T16:00:00-05:00',
            'Open',
          ),
          phase(
            'Post-Trading Session',
            '',
            '2022-01-01T16:00:00-05:00',
            '2022-01-01T20:00:00-05:00',
          ),
        ]),
      )

      expect(result).toStrictEqual([
        {
          status: TwentyfourFiveMarketStatus.OVERNIGHT,
          statusString: 'OVERNIGHT',
          time: '2021-12-31T20:00:00-05:00',
          endTime: '2022-01-01T04:00:00-05:00',
        },
        {
          status: TwentyfourFiveMarketStatus.PRE_MARKET,
          statusString: 'PRE_MARKET',
          time: '2022-01-01T04:00:00-05:00',
          endTime: '2022-01-01T09:30:00-05:00',
        },
        {
          status: TwentyfourFiveMarketStatus.REGULAR,
          statusString: 'REGULAR',
          time: '2022-01-01T09:30:00-05:00',
          endTime: '2022-01-01T16:00:00-05:00',
        },
        {
          status: TwentyfourFiveMarketStatus.POST_MARKET,
          statusString: 'POST_MARKET',
          time: '2022-01-01T16:00:00-05:00',
          endTime: '2022-01-01T20:00:00-05:00',
        },
      ])
    })

    it('passes endTime through unchanged even when it does not match the next phase start', () => {
      // endTime is upstream's data, passed through without interpretation; it is
      // load-bearing at the boundary before a closed span, where no next phase exists.
      const result = parseMarketSession(
        body([
          phase(
            'Post-Trading Session',
            '',
            '2022-01-01T16:00:00-05:00',
            '2022-01-01T19:00:00-05:00', // early close: next phase does not start at 19:00
          ),
          phase('Other', 'Overnight', '2022-01-02T20:00:00-05:00', '2022-01-03T04:00:00-05:00'),
        ]),
      )

      expect(result[0].endTime).toBe('2022-01-01T19:00:00-05:00')
      expect(result[1].time).toBe('2022-01-02T20:00:00-05:00')
    })
  })

  describe('closed-span derivation input (weekend/holiday)', () => {
    it('exposes the last post-market end before a multi-day gap (the closed-span start)', () => {
      // Thanksgiving-style week: Wednesday post-market ends 20:00, no phases at all
      // until Friday pre-market. A caller derives the closed-span start as the endTime
      // of the last transition before the gap.
      const result = parseMarketSession(
        body([
          phase(
            'Post-Trading Session',
            '',
            '2022-11-23T16:00:00-05:00',
            '2022-11-23T20:00:00-05:00',
          ),
          // Thursday (holiday): no phases
          phase(
            'Pre-Trading Session',
            '',
            '2022-11-25T04:00:00-05:00',
            '2022-11-25T09:30:00-05:00',
          ),
        ]),
      )

      const lastBeforeGap = result[result.length - 2]
      expect(lastBeforeGap.status).toBe(TwentyfourFiveMarketStatus.POST_MARKET)
      expect(lastBeforeGap.endTime).toBe('2022-11-23T20:00:00-05:00')
    })
  })

  describe('existing behavior preserved', () => {
    it('classifies statuses exactly as before (Other+Overnight, Pre, Primary, Post)', () => {
      const result = parseMarketSession(
        body([
          phase('Other', 'Overnight', '2021-12-31T20:00:00-05:00', '2022-01-01T04:00:00-05:00'),
          phase(
            'Pre-Trading Session',
            '',
            '2022-01-01T04:00:00-05:00',
            '2022-01-01T09:30:00-05:00',
          ),
          phase(
            'Primary Trading Session',
            '',
            '2022-01-01T09:30:00-05:00',
            '2022-01-01T16:00:00-05:00',
            'Open',
          ),
          phase(
            'Post-Trading Session',
            '',
            '2022-01-01T16:00:00-05:00',
            '2022-01-01T20:00:00-05:00',
          ),
        ]),
      )

      expect(result.map((r) => r.status)).toStrictEqual([
        TwentyfourFiveMarketStatus.OVERNIGHT,
        TwentyfourFiveMarketStatus.PRE_MARKET,
        TwentyfourFiveMarketStatus.REGULAR,
        TwentyfourFiveMarketStatus.POST_MARKET,
      ])
    })

    it('still filters out UNKNOWN phases (unrecognized type/name), end time or not', () => {
      const result = parseMarketSession(
        body([
          phase('Other', 'Pre-Close', '2022-01-01T15:55:00-05:00', '2022-01-01T16:00:00-05:00'),
          phase(
            'Primary Trading Session',
            '',
            '2022-01-01T09:30:00-05:00',
            '2022-01-01T16:00:00-05:00',
            'Open',
          ),
        ]),
      )

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe(TwentyfourFiveMarketStatus.REGULAR)
    })

    it('never emits a WEEKEND transition — closures remain an absence of phases', () => {
      const result = parseMarketSession(
        body([
          phase(
            'Post-Trading Session',
            '',
            '2022-01-01T16:00:00-05:00',
            '2022-01-01T20:00:00-05:00',
          ),
        ]),
      )

      expect(result.some((r) => r.status === TwentyfourFiveMarketStatus.WEEKEND)).toBe(false)
    })
  })
})
