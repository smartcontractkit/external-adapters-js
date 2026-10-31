import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { getSessionStartTransitions } from '../../../src/lib/session/session'
import { getSessionTransitions } from '../../../src/lib/session/tradingHoursSession'

// Tests for the session transition schedule used by session-start (pre-open warm-up)
// gating: unfiltered statuses, and the no-throw wrapper. The EA relies on the
// tradinghours EA being up — there is deliberately no local caching.

const scheduleResponse = (result: unknown) => ({
  response: {
    data: { data: { result }, statusCode: 200 },
  },
})

const requesterWith = (impl: () => Promise<unknown>) =>
  ({ request: jest.fn().mockImplementation(impl) } as unknown as Requester)

const URL = 'https://tradinghours.example.com'
const ARGS: [string, string, string] = ['UTC', 'nyse', '24/5']

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

describe('getSessionStartTransitions', () => {
  it('returns undefined when session params are missing', async () => {
    const requester = requesterWith(() => Promise.resolve(scheduleResponse([])))

    await expect(getSessionStartTransitions(URL, requester)).resolves.toBeUndefined()
    expect((requester.request as jest.Mock).mock.calls).toHaveLength(0)
  })

  it('returns undefined (rather than throwing) when the schedule cannot be fetched', async () => {
    const requester = requesterWith(() => Promise.reject(new Error('tradinghours down')))

    await expect(getSessionStartTransitions(URL, requester, ...ARGS)).resolves.toBeUndefined()
  })

  it('returns the transitions when the fetch succeeds', async () => {
    const requester = requesterWith(() =>
      Promise.resolve(
        scheduleResponse([
          { status: 2, statusString: 'REGULAR', time: '2024-01-08T09:30:00.000Z' },
        ]),
      ),
    )

    const result = await getSessionStartTransitions(URL, requester, ...ARGS)

    expect(result).toHaveLength(1)
  })
})
