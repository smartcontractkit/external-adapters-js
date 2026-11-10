import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { getSessionSchedule } from '../../../src/lib/session/session'
import {
  getSessionTransitions,
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
