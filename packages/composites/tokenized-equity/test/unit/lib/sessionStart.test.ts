import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { getSessionSchedule } from '../../../src/lib/session/session'
import {
  getSessionTransitions,
  processData,
  SessionTransition,
} from '../../../src/lib/session/tradingHoursSession'

// Tests for the session transition schedule used by session-start (pre-open warm-up)
// gating: unfiltered statuses, and the shared per-request fetch (getSessionSchedule)
// that serves both gating (unfiltered transitions; undefined = fail closed) and the
// smoother (seconds-from-transition; falls back to sessionBoundaries on failure).
// The EA relies on the tradinghours EA being up — there is deliberately no local
// caching.

const scheduleResponse = (result: unknown) => ({
  response: {
    data: { data: { result }, statusCode: 200 },
  },
})

const requesterWith = (impl: () => Promise<unknown>) =>
  ({ request: jest.fn().mockImplementation(impl) } as unknown as Requester)

const URL = 'https://tradinghours.example.com'
const ARGS: [string, string, string] = ['UTC', 'nyse', '24/5']
const BOUNDARIES = ['04:00', '09:30', '16:00', '20:00']

describe('getSessionTransitions', () => {
  beforeAll(() => {
    LoggerFactoryProvider.set()
  })

  it('passes the upstream phase end through as endTimeMs (tradinghours ADR-0001)', async () => {
    const requester = requesterWith(() =>
      Promise.resolve(
        scheduleResponse([
          {
            status: 2,
            statusString: 'REGULAR',
            time: '2024-01-08T14:30:00.000Z',
            endTime: '2024-01-08T21:00:00.000Z',
          },
        ]),
      ),
    )

    const result = await getSessionTransitions(URL, requester, ...ARGS)

    expect(result).toEqual([
      {
        status: TwentyfourFiveMarketStatus.REGULAR,
        timeMs: new Date('2024-01-08T14:30:00.000Z').getTime(),
        endTimeMs: new Date('2024-01-08T21:00:00.000Z').getTime(),
      },
    ])
  })

  it('leaves endTimeMs unset for a pre-endTime tradinghours (absent field)', async () => {
    const requester = requesterWith(() =>
      Promise.resolve(
        scheduleResponse([
          { status: 2, statusString: 'REGULAR', time: '2024-01-08T14:30:00.000Z' },
        ]),
      ),
    )

    const result = await getSessionTransitions(URL, requester, ...ARGS)

    expect(result[0].endTimeMs).toBeUndefined()
  })

  it('treats an empty endTime as "no end" rather than malformed (keeps the schedule)', async () => {
    // An empty string parses to NaN; rejecting on it would discard every start
    // time in the schedule and send 24/5 and 24/7 gating to the fallback.
    const requester = requesterWith(() =>
      Promise.resolve(
        scheduleResponse([
          { status: 2, statusString: 'REGULAR', time: '2024-01-08T14:30:00.000Z', endTime: '' },
        ]),
      ),
    )

    const result = await getSessionTransitions(URL, requester, ...ARGS)

    expect(result).toEqual([
      {
        status: TwentyfourFiveMarketStatus.REGULAR,
        timeMs: new Date('2024-01-08T14:30:00.000Z').getTime(),
      },
    ])
  })

  it('smoother filtering (processData) is unchanged when transitions carry endTimeMs', async () => {
    // The smoother must not react to the new field: same drops as before (REGULAR and
    // Sunday overnight dropped; thin-liquidity boundaries kept).
    const transitions: SessionTransition[] = [
      {
        status: TwentyfourFiveMarketStatus.OVERNIGHT,
        timeMs: new Date('2024-01-07T20:00:00.000Z').getTime(),
        endTimeMs: 1,
      }, // Sunday — dropped
      {
        status: TwentyfourFiveMarketStatus.PRE_MARKET,
        timeMs: new Date('2024-01-08T04:00:00.000Z').getTime(),
        endTimeMs: 1,
      },
      {
        status: TwentyfourFiveMarketStatus.REGULAR,
        timeMs: new Date('2024-01-08T09:30:00.000Z').getTime(),
        endTimeMs: 1,
      }, // dropped
      {
        status: TwentyfourFiveMarketStatus.POST_MARKET,
        timeMs: new Date('2024-01-08T16:00:00.000Z').getTime(),
        endTimeMs: 1,
      },
      {
        status: TwentyfourFiveMarketStatus.OVERNIGHT,
        timeMs: new Date('2024-01-08T20:00:00.000Z').getTime(),
        endTimeMs: 1,
      }, // Monday — kept
    ]

    expect(processData(transitions, 'UTC')).toEqual([
      new Date('2024-01-08T04:00:00.000Z').getTime(),
      new Date('2024-01-08T16:00:00.000Z').getTime(),
      new Date('2024-01-08T20:00:00.000Z').getTime(),
    ])
  })

  it('returns all transitions unfiltered, including REGULAR and Sunday overnight', async () => {
    const requester = requesterWith(() =>
      Promise.resolve(
        scheduleResponse([
          // Sunday overnight — skipped by the smoothing path, required here
          { status: 4, statusString: 'OVERNIGHT', time: '2024-01-07T20:00:00.000Z' },
          { status: 1, statusString: 'PRE_MARKET', time: '2024-01-08T04:00:00.000Z' },
          { status: 2, statusString: 'REGULAR', time: '2024-01-08T09:30:00.000Z' },
          { status: 3, statusString: 'POST_MARKET', time: '2024-01-08T16:00:00.000Z' },
        ]),
      ),
    )

    const result = await getSessionTransitions(URL, requester, ...ARGS)

    expect(result.map((t) => t.status)).toEqual([
      TwentyfourFiveMarketStatus.OVERNIGHT,
      TwentyfourFiveMarketStatus.PRE_MARKET,
      TwentyfourFiveMarketStatus.REGULAR,
      TwentyfourFiveMarketStatus.POST_MARKET,
    ])
    expect(result[0].timeMs).toEqual(new Date('2024-01-07T20:00:00.000Z').getTime())
  })

  it('throws when the fetch fails', async () => {
    const requester = requesterWith(() => Promise.reject(new Error('tradinghours down')))

    await expect(getSessionTransitions(URL, requester, ...ARGS)).rejects.toThrow(
      'tradinghours down',
    )
  })

  it('processData handles the widened 5-day lookback window (older phases present)', () => {
    // The tradinghours market-session query now reaches back 5 days, so every
    // market-session consumer — 24/5 smoothing included — receives ~4 more days of
    // phases. A full trading day is PRE 04:00 / REGULAR 09:30 / POST 16:00 /
    // OVERNIGHT 20:00; the window below spans Thu 2024-01-04 .. Tue 2024-01-09
    // (Mon 2024-01-08 is "today"), plus the Sunday 20:00 overnight.
    const day = (
      d: string, // YYYY-MM-DD
    ): SessionTransition[] => [
      {
        status: TwentyfourFiveMarketStatus.PRE_MARKET,
        timeMs: new Date(`${d}T04:00:00.000Z`).getTime(),
      },
      {
        status: TwentyfourFiveMarketStatus.REGULAR,
        timeMs: new Date(`${d}T09:30:00.000Z`).getTime(),
      },
      {
        status: TwentyfourFiveMarketStatus.POST_MARKET,
        timeMs: new Date(`${d}T16:00:00.000Z`).getTime(),
      },
      {
        status: TwentyfourFiveMarketStatus.OVERNIGHT,
        timeMs: new Date(`${d}T20:00:00.000Z`).getTime(),
      },
    ]
    const transitions: SessionTransition[] = [
      ...day('2024-01-04'),
      ...day('2024-01-05'),
      // Weekend: only the Sunday overnight exists in a real schedule.
      {
        status: TwentyfourFiveMarketStatus.OVERNIGHT,
        timeMs: new Date('2024-01-07T20:00:00.000Z').getTime(),
      },
      ...day('2024-01-08'),
      ...day('2024-01-09'),
    ]

    // REGULAR is dropped everywhere and the Sunday overnight is still dropped with
    // older days present; everything else passes through in order.
    expect(processData(transitions, 'UTC')).toEqual([
      new Date('2024-01-04T04:00:00.000Z').getTime(),
      new Date('2024-01-04T16:00:00.000Z').getTime(),
      new Date('2024-01-04T20:00:00.000Z').getTime(),
      new Date('2024-01-05T04:00:00.000Z').getTime(),
      new Date('2024-01-05T16:00:00.000Z').getTime(),
      new Date('2024-01-05T20:00:00.000Z').getTime(),
      new Date('2024-01-08T04:00:00.000Z').getTime(),
      new Date('2024-01-08T16:00:00.000Z').getTime(),
      new Date('2024-01-08T20:00:00.000Z').getTime(),
      new Date('2024-01-09T04:00:00.000Z').getTime(),
      new Date('2024-01-09T16:00:00.000Z').getTime(),
      new Date('2024-01-09T20:00:00.000Z').getTime(),
    ])

    // The smoother's signal is secondsFromNearest over this list: the extra older
    // boundaries are always farther from "now" than the current day's, so the 24/5
    // smoothing result is unchanged by the wider window. Spot-check Monday pre-open
    // (nearest = Monday 04:00 PRE_MARKET, not anything from last week) and Monday
    // evening (nearest = Monday 20:00 OVERNIGHT).
    const times = processData(transitions, 'UTC')
    const nearest = (nowMs: number) =>
      times.reduce((a, b) => (Math.abs(nowMs - b) < Math.abs(nowMs - a) ? b : a))
    expect(nearest(new Date('2024-01-08T03:00:00.000Z').getTime())).toBe(
      new Date('2024-01-08T04:00:00.000Z').getTime(),
    )
    expect(nearest(new Date('2024-01-08T21:00:00.000Z').getTime())).toBe(
      new Date('2024-01-08T20:00:00.000Z').getTime(),
    )
  })
})

describe('getSessionSchedule', () => {
  it('returns neither result and does not fetch when session params are missing', async () => {
    const requester = requesterWith(() => Promise.resolve(scheduleResponse([])))

    const schedule = await getSessionSchedule(URL, requester, BOUNDARIES)

    expect(schedule.transitions).toBeUndefined()
    expect(schedule.secondsFromTransition).toBeUndefined()
    expect((requester.request as jest.Mock).mock.calls).toHaveLength(0)
  })

  it('serves both consumers from a single fetch', async () => {
    const requester = requesterWith(() =>
      Promise.resolve(
        scheduleResponse([
          { status: 1, statusString: 'PRE_MARKET', time: '2024-01-08T04:00:00.000Z' },
          { status: 2, statusString: 'REGULAR', time: '2024-01-08T09:30:00.000Z' },
        ]),
      ),
    )

    const schedule = await getSessionSchedule(URL, requester, BOUNDARIES, ...ARGS)

    expect((requester.request as jest.Mock).mock.calls).toHaveLength(1)
    // Gating gets the unfiltered transitions (REGULAR retained)…
    expect(schedule.transitions?.map((t) => t.status)).toEqual([
      TwentyfourFiveMarketStatus.PRE_MARKET,
      TwentyfourFiveMarketStatus.REGULAR,
    ])
    // …while the smoother's signal comes from the filtered view of the same fetch.
    expect(schedule.secondsFromTransition?.source).toEqual('TRADINGHOURS')
    expect(schedule.secondsFromTransition?.value).not.toEqual(Number.MAX_SAFE_INTEGER)
  })

  it('fails closed for gating and falls back for the smoother when the fetch fails', async () => {
    const requester = requesterWith(() => Promise.reject(new Error('tradinghours down')))

    const schedule = await getSessionSchedule(URL, requester, BOUNDARIES, ...ARGS)

    // Gating: no tradinghours schedule (transitions undefined) — the caller walks to
    // fallbackTransitions (next test).
    expect(schedule.transitions).toBeUndefined()
    // Smoother: historical sessionBoundaries fallback still applies.
    expect(schedule.secondsFromTransition?.source).toEqual('FALLBACK')
    expect(schedule.secondsFromTransition?.value).not.toEqual(Number.MAX_SAFE_INTEGER)
  })

  it('serves the hard-coded fallback schedule as fallbackTransitions when the fetch fails', async () => {
    const requester = requesterWith(() => Promise.reject(new Error('tradinghours down')))

    const schedule = await getSessionSchedule(URL, requester, BOUNDARIES, ...ARGS)

    // Gating falls back to the hard-coded labeled schedule (never sessionBoundaries):
    // labeled, and precise about the 09:30 regular open.
    expect(schedule.fallbackTransitions).toBeDefined()
    const fallback = schedule.fallbackTransitions as SessionTransition[]
    expect(fallback.map((t) => t.status)).toContain(TwentyfourFiveMarketStatus.REGULAR)
  })

  it('returns no fallbackTransitions for market/type pairs without a hard-coded entry', async () => {
    const requester = requesterWith(() => Promise.reject(new Error('tradinghours down')))

    const schedule = await getSessionSchedule(URL, requester, BOUNDARIES, 'UTC', 'lse', '24/5')

    expect(schedule.transitions).toBeUndefined()
    expect(schedule.fallbackTransitions).toBeUndefined()
    // The smoother's own fallback is unaffected by the unknown market.
    expect(schedule.secondsFromTransition?.source).toEqual('FALLBACK')
  })

  it('always provides fallbackTransitions for a known market, even when tradinghours succeeds', async () => {
    // A tradinghours schedule that lacks a transition for the selected session is
    // unusable — getStream walks to the fallback, so it must be present.
    const requester = requesterWith(() =>
      Promise.resolve(
        scheduleResponse([
          { status: 1, statusString: 'PRE_MARKET', time: '2024-01-08T04:00:00.000Z' },
        ]),
      ),
    )

    const schedule = await getSessionSchedule(URL, requester, BOUNDARIES, ...ARGS)

    expect(schedule.transitions).toHaveLength(1)
    expect(schedule.fallbackTransitions).toBeDefined()
  })

  it('gates without sessionBoundaries/sessionBoundariesTimeZone (smoother-only params)', async () => {
    // Gating needs only sessionMarket/sessionMarketType; the timezone for the tier-1
    // call and the fallback comes from the hard-coded map entry.
    const requester = requesterWith(() =>
      Promise.resolve(
        scheduleResponse([
          { status: 2, statusString: 'REGULAR', time: '2024-01-08T14:30:00.000Z' },
        ]),
      ),
    )

    const schedule = await getSessionSchedule(URL, requester, [], undefined, 'nyse', '24/5')

    expect((requester.request as jest.Mock).mock.calls).toHaveLength(1)
    expect(schedule.transitions).toHaveLength(1)
    expect(schedule.fallbackTransitions).toBeDefined()
    // The smoother's signal requires its own params and is absent here.
    expect(schedule.secondsFromTransition).toBeUndefined()
  })
})
