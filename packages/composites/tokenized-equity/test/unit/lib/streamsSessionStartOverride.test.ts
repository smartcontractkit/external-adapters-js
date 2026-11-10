import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { SessionTransition } from '../../../src/lib/session/tradingHoursSession'
import { getPrice } from '../../../src/lib/streams'

// Tests for the marketSessionOverride test hook: when set, session-start gating
// resolves the NEXT start of the named session (first tradinghours transition
// strictly after now) instead of the current session's start, deterministically
// forcing the pre-session rejection. Tradinghours schedule only — the hard-coded
// fallback is never consulted for the override; no future transition → fail closed
// (503). Override-forced rejections carry a [marketSessionOverride=...] marker.

const mockGetDeutscheBoersePrice = jest.fn()

jest.mock('@chainlink/data-engine-adapter', () => ({
  getDeutscheBoersePrice: (
    feedId: string,
    url: string,
    requester: Requester,
    options?: { maxAgeInSeconds?: number },
  ) => mockGetDeutscheBoersePrice(feedId, url, requester, options),
}))

const NOW_MS = 1_700_000_000_000 // fixed clock for deterministic resolution

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

describe('getPrice session-start gating with marketSessionOverride', () => {
  const extendedStreamId = 'extended-stream'
  const requester = {} as unknown as Requester

  let dateSpy: jest.SpyInstance

  beforeAll(() => {
    dateSpy = jest.spyOn(Date, 'now').mockReturnValue(NOW_MS)
  })

  afterAll(() => {
    dateSpy.mockRestore()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // A fresh in-session extended report: feed says PRE_MARKET, produced seconds ago.
  const freshPreMarketReport = () =>
    createStreamData('100.5', TwentyfourFiveMarketStatus.PRE_MARKET, nsAtMs(NOW_MS - 5_000))

  const setupExtended = (data: unknown) => {
    mockGetDeutscheBoersePrice.mockImplementation((streamId: string) =>
      streamId === extendedStreamId
        ? Promise.resolve(data)
        : Promise.reject(new Error(`Unexpected streamId: ${streamId}`)),
    )
  }

  const getPriceWithOverride = (
    marketSessionOverride: TwentyfourFiveMarketStatus,
    transitions?: SessionTransition[],
    fallbackTransitions?: SessionTransition[],
  ) =>
    getPrice('', requester, undefined, extendedStreamId, undefined, undefined, {
      sessionStartGating: {
        transitions,
        fallbackTransitions,
        marketSessionOverride,
      },
    })

  it.each([
    ['PRE_MARKET', TwentyfourFiveMarketStatus.PRE_MARKET],
    ['REGULAR', TwentyfourFiveMarketStatus.REGULAR],
    ['POST_MARKET', TwentyfourFiveMarketStatus.POST_MARKET],
    ['OVERNIGHT', TwentyfourFiveMarketStatus.OVERNIGHT],
  ])(
    'rejects a fresh report when %s opens in the future (503 with forced marker)',
    async (name, status) => {
      setupExtended(freshPreMarketReport())

      await expect(
        getPriceWithOverride(status, [
          transition(TwentyfourFiveMarketStatus.PRE_MARKET, -3600), // current session
          transition(status, 3600), // next start of the overridden session
        ]),
      ).rejects.toThrow(
        expect.objectContaining({
          statusCode: 503,
          message: expect.stringMatching(
            new RegExp(`Market data predates session start: .*\\[marketSessionOverride=${name}\\]`),
          ),
        }),
      )
    },
  )

  it('passes when the report is newer than the overridden session start', async () => {
    // Pathological but valid: the override resolves a future start, and the report is
    // newer still (lastSeen in the future relative to that start). The real comparison
    // runs unchanged — only the session-start input is perturbed.
    const futureReport = createStreamData(
      '100.5',
      TwentyfourFiveMarketStatus.PRE_MARKET,
      nsAtMs(NOW_MS + 7_200_000),
    )
    setupExtended(futureReport)

    const result = await getPriceWithOverride(TwentyfourFiveMarketStatus.REGULAR, [
      transition(TwentyfourFiveMarketStatus.REGULAR, 3600),
    ])

    expect(result.price).toEqual(futureReport.mid)
  })

  it('fails closed with a forced marker when tradinghours has no future start for the overridden session', async () => {
    setupExtended(freshPreMarketReport())

    await expect(
      getPriceWithOverride(TwentyfourFiveMarketStatus.OVERNIGHT, [
        transition(TwentyfourFiveMarketStatus.OVERNIGHT, -3600), // past start only
      ]),
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 503,
        message: expect.stringMatching(
          /Session start unknown.*\[marketSessionOverride=OVERNIGHT\]/,
        ),
      }),
    )
  })

  it('does not consult the hard-coded fallback schedule for the override', async () => {
    // Tradinghours unreachable (no transitions) but the fallback schedule could supply
    // a future start — per design the override never uses it: fail closed instead.
    setupExtended(freshPreMarketReport())

    await expect(
      getPriceWithOverride(TwentyfourFiveMarketStatus.REGULAR, undefined, [
        transition(TwentyfourFiveMarketStatus.REGULAR, 3600),
      ]),
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 503,
        message: expect.stringMatching(/Session start unknown.*\[marketSessionOverride=REGULAR\]/),
      }),
    )
  })

  it('uses the earliest future transition when the overridden session opens more than once', async () => {
    setupExtended(freshPreMarketReport())

    await expect(
      getPriceWithOverride(TwentyfourFiveMarketStatus.REGULAR, [
        transition(TwentyfourFiveMarketStatus.REGULAR, -3600), // past: ignored
        transition(TwentyfourFiveMarketStatus.REGULAR, 7200),
        transition(TwentyfourFiveMarketStatus.REGULAR, 3600), // earliest future start wins
      ]),
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 503,
        // The earliest future start (1h out) minus a 5s-old report = 3605s before start.
        message: expect.stringMatching(/lastSeen 3605s before session start/),
      }),
    )
  })

  it('leaves the wall-clock behavior untouched when the override is absent', async () => {
    // Same schedule and fresh report as the override tests, but no override: the
    // current session (PRE_MARKET, opened 1h ago) governs and the report passes.
    setupExtended(freshPreMarketReport())

    const result = await getPrice(
      '',
      requester,
      undefined,
      extendedStreamId,
      undefined,
      undefined,
      {
        sessionStartGating: {
          transitions: [
            transition(TwentyfourFiveMarketStatus.PRE_MARKET, -3600),
            transition(TwentyfourFiveMarketStatus.REGULAR, 3600),
          ],
        },
      },
    )

    expect(result.price).toEqual('100.5')
  })
})
