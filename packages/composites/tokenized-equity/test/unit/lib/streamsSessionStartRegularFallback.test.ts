import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { getFallbackSessionTransitions } from '../../../src/lib/session/fallbackSessionSchedule'
import { getPrice } from '../../../src/lib/streams'

// Session-start gating driven by the real hard-coded nyse/regular fallback schedule
// (tradinghours transitions absent), end-to-end through getPrice. Complements the
// schedule-shape tests in fallbackSessionSchedule.test.ts: those pin what the fallback
// contains; these pin how the gate behaves with it — including the deliberate
// narrowing vs nyse/24/5 (no extended-hours or overnight sessions).

LoggerFactoryProvider.set()

const mockGetDeutscheBoersePrice = jest.fn()

jest.mock('@chainlink/data-engine-adapter', () => ({
  getDeutscheBoersePrice: (
    feedId: string,
    url: string,
    requester: Requester,
    options?: { maxAgeInSeconds?: number },
  ) => mockGetDeutscheBoersePrice(feedId, url, requester, options),
}))

const nsAtMs = (ms: number) => String(BigInt(ms) * 10n ** 6n)

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

describe('getPrice session-start gating with the nyse/regular fallback schedule', () => {
  const regularStreamId = 'regular-stream'
  const overnightStreamId = 'overnight-stream'
  const requester = {} as unknown as Requester

  let dateSpy: jest.SpyInstance

  // Monday 2024-01-08 15:00 UTC = 10:00 ET — inside the regular session (EST, UTC-5).
  const NOW_MS = new Date('2024-01-08T15:00:00.000Z').getTime()
  // The real fallback schedule for this moment, exactly as getSessionSchedule would
  // produce it when the tradinghours fetch has failed.
  const fallbackTransitions = getFallbackSessionTransitions('nyse', 'regular', NOW_MS)

  beforeAll(() => {
    dateSpy = jest.spyOn(Date, 'now').mockReturnValue(NOW_MS)
  })

  afterAll(() => {
    dateSpy.mockRestore()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('passes a fresh regular-session report and attributes the gate to the fallback', async () => {
    expect(fallbackTransitions).toBeDefined()
    const regularData = createStreamData(
      '100.5',
      TwentyfourFiveMarketStatus.REGULAR,
      nsAtMs(NOW_MS - 5_000),
    )
    mockGetDeutscheBoersePrice.mockImplementation((streamId: string) =>
      streamId === regularStreamId
        ? Promise.resolve(regularData)
        : Promise.reject(new Error('streamId not provided')),
    )

    const result = await getPrice('', requester, regularStreamId, undefined, undefined, undefined, {
      sessionStartGating: { fallbackTransitions },
    })

    expect(result.price).toEqual(regularData.mid)
    expect(result.gatingSessionSource).toBe('FALLBACK')
  })

  it('rejects with 503 a regular report from before the 09:30 ET open', async () => {
    // Report last seen at 09:00 ET (14:00 UTC) — 30 minutes before today's regular
    // open at 09:30 ET (14:30 UTC).
    const regularData = createStreamData(
      '100.5',
      TwentyfourFiveMarketStatus.REGULAR,
      nsAtMs(new Date('2024-01-08T14:00:00.000Z').getTime()),
    )
    mockGetDeutscheBoersePrice.mockImplementation((streamId: string) =>
      streamId === regularStreamId
        ? Promise.resolve(regularData)
        : Promise.reject(new Error('streamId not provided')),
    )

    await expect(
      getPrice('', requester, regularStreamId, undefined, undefined, undefined, {
        sessionStartGating: { fallbackTransitions },
      }),
    ).rejects.toMatchObject({
      statusCode: 503,
      message: expect.stringContaining('Market data predates session start'),
    })
  })

  it('fails closed for an overnight-eligible stream — the narrowed fallback has no overnight sessions', async () => {
    // Pins the narrowing: under nyse/24/5 the Sunday 20:00 ET overnight open would
    // supply this session start; nyse/regular must not. Monday 01:00 UTC = Sunday
    // 20:00 ET, exactly when the 24/5 overnight session would open.
    const sundayOvernightMs = new Date('2024-01-08T01:00:00.000Z').getTime()
    dateSpy.mockReturnValue(sundayOvernightMs)
    const overnightFallback = getFallbackSessionTransitions('nyse', 'regular', sundayOvernightMs)

    const overnightData = createStreamData(
      '100.5',
      TwentyfourFiveMarketStatus.OVERNIGHT,
      nsAtMs(sundayOvernightMs - 5_000),
    )
    mockGetDeutscheBoersePrice.mockImplementation((streamId: string) =>
      streamId === overnightStreamId
        ? Promise.resolve(overnightData)
        : Promise.reject(new Error('streamId not provided')),
    )

    await expect(
      getPrice('', requester, undefined, undefined, overnightStreamId, undefined, {
        sessionStartGating: { fallbackTransitions: overnightFallback },
      }),
    ).rejects.toMatchObject({
      statusCode: 503,
      message: expect.stringContaining('Session start unknown'),
    })

    dateSpy.mockReturnValue(NOW_MS)
  })
})
