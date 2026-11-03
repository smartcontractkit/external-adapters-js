import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { SessionTransition } from '../../../src/lib/session/tradingHoursSession'
import { getPrice } from '../../../src/lib/streams'

// Tests for the pre-open warm-up (session-start) gating (DF-28181): when enabled, a
// selected report whose lastSeenTimestampNs is before the start of the current session
// (per the tradinghours market-session schedule) is rejected with 503.

const mockGetDeutscheBoersePrice = jest.fn()

jest.mock('@chainlink/data-engine-adapter', () => ({
  getDeutscheBoersePrice: (
    feedId: string,
    url: string,
    requester: Requester,
    options?: { maxAgeInSeconds?: number },
  ) => mockGetDeutscheBoersePrice(feedId, url, requester, options),
}))

const NOW_MS = 1_700_000_000_000 // fixed clock for deterministic ages

const nsAtMs = (ms: number) => String(BigInt(ms) * 10n ** 6n)

const transition = (
  status: TwentyfourFiveMarketStatus,
  offsetSeconds: number,
): SessionTransition => ({
  status,
  timeMs: NOW_MS + offsetSeconds * 1000,
})

const createStreamData = (
  mid: string,
  marketStatus: TwentyfourFiveMarketStatus,
  lastSeenTimestampNs: string,
) => ({
  mid,
  decimals: 18,
  marketStatus,
  lastSeenTimestampNs,
  bid: '100',
  bidVolume: 1000,
  ask: '101',
  askVolume: 2000,
  lastTradedPrice: '102.0',
})

describe('getPrice session-start (pre-open warm-up) gating', () => {
  const regularStreamId = 'regular-stream'
  const extendedStreamId = 'extended-stream'
  const overnightStreamId = 'overnight-stream'
  const requester = {} as unknown as Requester

  let dateSpy: jest.SpyInstance

  const setupMock = (regularData: unknown, extendedData: unknown, overnightData: unknown) => {
    mockGetDeutscheBoersePrice.mockImplementation((streamId: string) => {
      if (streamId === regularStreamId) {
        return Promise.resolve(regularData)
      } else if (streamId === extendedStreamId) {
        return Promise.resolve(extendedData)
      } else if (streamId === overnightStreamId) {
        return Promise.resolve(overnightData)
      }
      return Promise.reject(new Error(`Unexpected streamId: ${streamId}`))
    })
  }

  // A regular session that started an hour ago.
  const regularSchedule = [transition(TwentyfourFiveMarketStatus.REGULAR, -3600)]

  beforeAll(() => {
    dateSpy = jest.spyOn(Date, 'now').mockReturnValue(NOW_MS)
  })

  afterAll(() => {
    dateSpy.mockRestore()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('passes through a report produced after the current session start', async () => {
    const regularData = createStreamData(
      '100.5',
      TwentyfourFiveMarketStatus.REGULAR,
      nsAtMs(NOW_MS - 5_000),
    )
    setupMock(regularData, null, null)

    const result = await getPrice(
      '',
      requester,
      regularStreamId,
      undefined,
      undefined,
      undefined,
      undefined,
      { transitions: regularSchedule },
    )

    expect(result.price).toEqual(regularData.mid)
  })

  it('rejects with 503 a report from before the current session start', async () => {
    // Session started 1h ago; the report is 2h old — a leftover from the previous session.
    const regularData = createStreamData(
      '100.5',
      TwentyfourFiveMarketStatus.REGULAR,
      nsAtMs(NOW_MS - 7_200_000),
    )
    setupMock(regularData, null, null)

    await expect(
      getPrice('', requester, regularStreamId, undefined, undefined, undefined, undefined, {
        transitions: regularSchedule,
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 503,
        message: expect.stringMatching(/Market data predates session start: regular PRE_SESSION/),
      }),
    )
  })

  it('reports PRE_SESSION (not STALE) when a report is both pre-session and stale', async () => {
    // Session-start runs before staleness: a pre-session leftover is invalid regardless
    // of age, so the session-boundary reason wins even with a staleness threshold set.
    const regularData = createStreamData(
      '100.5',
      TwentyfourFiveMarketStatus.REGULAR,
      nsAtMs(NOW_MS - 7_200_000), // 2h old: pre-session AND older than the 30s threshold
    )
    setupMock(regularData, null, null)

    await expect(
      getPrice(
        '',
        requester,
        regularStreamId,
        undefined,
        undefined,
        undefined,
        { regular: 30 },
        { transitions: regularSchedule },
      ),
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 503,
        message: expect.stringMatching(/Market data predates session start: regular PRE_SESSION/),
      }),
    )
  })

  it('treats a report exactly at the session start as in-session', async () => {
    const regularData = createStreamData(
      '100.5',
      TwentyfourFiveMarketStatus.REGULAR,
      nsAtMs(NOW_MS - 3_600_000),
    )
    setupMock(regularData, null, null)

    const result = await getPrice(
      '',
      requester,
      regularStreamId,
      undefined,
      undefined,
      undefined,
      undefined,
      { transitions: regularSchedule },
    )

    expect(result.price).toEqual(regularData.mid)
  })

  it('passes pre-session reports through when gating is disabled', async () => {
    const regularData = createStreamData(
      '100.5',
      TwentyfourFiveMarketStatus.REGULAR,
      nsAtMs(NOW_MS - 7_200_000),
    )
    setupMock(regularData, null, null)

    const result = await getPrice('', requester, regularStreamId)

    expect(result.price).toEqual(regularData.mid)
  })

  it('fails closed only when no schedule of any kind is available', async () => {
    // Neither tradinghours transitions nor a hard-coded fallback: nothing can prove the
    // report is not a pre-session leftover, so 503. (Reached when the market identity
    // itself is unknown — e.g. sessionMarket/sessionMarketType absent.)
    const regularData = createStreamData(
      '100.5',
      TwentyfourFiveMarketStatus.REGULAR,
      nsAtMs(NOW_MS - 5_000),
    )
    setupMock(regularData, null, null)

    await expect(
      getPrice('', requester, regularStreamId, undefined, undefined, undefined, undefined, {
        transitions: undefined,
        fallbackTransitions: undefined,
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 503,
        message: expect.stringMatching(/Session start unknown/),
      }),
    )
  })

  it('falls back to the hard-coded schedule when tradinghours is unavailable', async () => {
    // Tradinghours down: fallbackTransitions carries the hard-coded schedule. A report
    // after the fallback session start passes.
    const regularData = createStreamData(
      '100.5',
      TwentyfourFiveMarketStatus.REGULAR,
      nsAtMs(NOW_MS - 5_000),
    )
    setupMock(regularData, null, null)

    const result = await getPrice(
      '',
      requester,
      regularStreamId,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        transitions: undefined,
        fallbackTransitions: regularSchedule,
      },
    )

    expect(result.price).toEqual(regularData.mid)
  })

  it('rejects pre-session reports against the fallback schedule when tradinghours is unavailable', async () => {
    // Fallback session started 1h ago; the report is 2h old — a leftover, gated even
    // without tradinghours.
    const regularData = createStreamData(
      '100.5',
      TwentyfourFiveMarketStatus.REGULAR,
      nsAtMs(NOW_MS - 7_200_000),
    )
    setupMock(regularData, null, null)

    await expect(
      getPrice('', requester, regularStreamId, undefined, undefined, undefined, undefined, {
        transitions: undefined,
        fallbackTransitions: regularSchedule,
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 503,
        message: expect.stringMatching(/Market data predates session start: regular PRE_SESSION/),
      }),
    )
  })

  it('walks to the fallback schedule when tradinghours has no transition opening the selected session', async () => {
    // Row 7: tradinghours answered but cannot place the current regular session. The
    // fallback schedule decides instead — report 5s after the fallback open passes.
    const regularData = createStreamData(
      '100.5',
      TwentyfourFiveMarketStatus.REGULAR,
      nsAtMs(NOW_MS - 5_000),
    )
    setupMock(regularData, null, null)

    const result = await getPrice(
      '',
      requester,
      regularStreamId,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        transitions: [transition(TwentyfourFiveMarketStatus.OVERNIGHT, -3600)],
        fallbackTransitions: regularSchedule,
      },
    )

    expect(result.price).toEqual(regularData.mid)
  })

  it('uses the fallback schedule to reject pre-session reports when tradinghours lacks the transition', async () => {
    const regularData = createStreamData(
      '100.5',
      TwentyfourFiveMarketStatus.REGULAR,
      nsAtMs(NOW_MS - 7_200_000),
    )
    setupMock(regularData, null, null)

    await expect(
      getPrice('', requester, regularStreamId, undefined, undefined, undefined, undefined, {
        transitions: [transition(TwentyfourFiveMarketStatus.OVERNIGHT, -3600)],
        fallbackTransitions: regularSchedule,
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 503,
        message: expect.stringMatching(/Market data predates session start: regular PRE_SESSION/),
      }),
    )
  })

  it('uses the latest matching transition as the extended session start', async () => {
    const schedule = [
      transition(TwentyfourFiveMarketStatus.PRE_MARKET, -6 * 3600),
      transition(TwentyfourFiveMarketStatus.POST_MARKET, -1800), // current session, started 30m ago
    ]

    // Report from 10m ago: in POST_MARKET, passes.
    const inSession = createStreamData(
      '99.5',
      TwentyfourFiveMarketStatus.POST_MARKET,
      nsAtMs(NOW_MS - 600_000),
    )
    setupMock(null, inSession, null)
    const result = await getPrice(
      '',
      requester,
      undefined,
      extendedStreamId,
      undefined,
      undefined,
      undefined,
      { transitions: schedule },
    )
    expect(result.price).toEqual(inSession.mid)

    // Report from 1h ago: after PRE_MARKET started but before POST_MARKET — rejected.
    const preSession = createStreamData(
      '99.5',
      TwentyfourFiveMarketStatus.POST_MARKET,
      nsAtMs(NOW_MS - 3_600_000),
    )
    setupMock(null, preSession, null)
    await expect(
      getPrice('', requester, undefined, extendedStreamId, undefined, undefined, undefined, {
        transitions: schedule,
      }),
    ).rejects.toThrow(expect.objectContaining({ statusCode: 503 }))
  })

  it('does not fail over to a fresher stream of a different session type', async () => {
    // Regular says REGULAR but its report predates the regular open; extended says
    // POST_MARKET and is fresh. Reject rather than silently switch pricing source.
    const regularData = createStreamData(
      '100.5',
      TwentyfourFiveMarketStatus.REGULAR,
      nsAtMs(NOW_MS - 7_200_000),
    )
    const extendedData = createStreamData(
      '99.5',
      TwentyfourFiveMarketStatus.POST_MARKET,
      nsAtMs(NOW_MS - 5_000),
    )
    setupMock(regularData, extendedData, null)

    await expect(
      getPrice('', requester, regularStreamId, extendedStreamId, undefined, undefined, undefined, {
        transitions: [
          ...regularSchedule,
          transition(TwentyfourFiveMarketStatus.POST_MARKET, -1800),
        ],
      }),
    ).rejects.toThrow(AdapterError)
  })

  it('uses the Sunday overnight transition when present in the schedule', async () => {
    // The smoothing path deliberately skips Sunday overnight transitions; gating must
    // not — otherwise every Sunday overnight open would fail closed for the session.
    const overnightData = createStreamData(
      '98.5',
      TwentyfourFiveMarketStatus.OVERNIGHT,
      nsAtMs(NOW_MS - 60_000), // 1m old, after the Sunday open
    )
    setupMock(null, null, overnightData)

    const result = await getPrice(
      '',
      requester,
      undefined,
      undefined,
      overnightStreamId,
      undefined,
      undefined,
      { transitions: [transition(TwentyfourFiveMarketStatus.OVERNIGHT, -600)] },
    )

    expect(result.price).toEqual(overnightData.mid)
  })
})
