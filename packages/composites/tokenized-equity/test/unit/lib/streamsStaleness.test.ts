import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { getPrice } from '../../../src/lib/streams'

// PR1 checkpoint 1: tests for the consumer-side staleness/freshness check (DF-28181).
// These exercise the new trailing `streamMaxAgeSeconds` argument of getPrice, which does not
// exist yet — this file is expected to fail (compile / assertions) until checkpoint 2.

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

const nsAtAge = (ageSeconds: number) => String(BigInt(NOW_MS - ageSeconds * 1000) * 10n ** 6n)

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

describe('getPrice staleness check', () => {
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

  beforeAll(() => {
    dateSpy = jest.spyOn(Date, 'now').mockReturnValue(NOW_MS)
  })

  afterAll(() => {
    dateSpy.mockRestore()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('passes through a fresh report within the threshold', async () => {
    const regularData = createStreamData('100.5', TwentyfourFiveMarketStatus.REGULAR, nsAtAge(5))
    setupMock(regularData, null, null)

    const result = await getPrice('', requester, regularStreamId, undefined, undefined, undefined, {
      regular: 30,
    })

    expect(result.price).toEqual(regularData.mid)
    expect(result.marketStatus).toEqual(TwentyfourFiveMarketStatus.REGULAR)
  })

  it('rejects with 503 when the active regular stream is stale', async () => {
    const regularData = createStreamData('100.5', TwentyfourFiveMarketStatus.REGULAR, nsAtAge(4000))
    setupMock(regularData, null, null)

    await expect(
      getPrice('', requester, regularStreamId, undefined, undefined, undefined, { regular: 30 }),
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 503,
        message: expect.stringMatching(/regular STALE.*age.*>/),
      }),
    )
  })

  it('rejects with 503 when the active extended stream is stale', async () => {
    const regularData = createStreamData('100.5', TwentyfourFiveMarketStatus.UNKNOWN, nsAtAge(4000))
    const extendedData = createStreamData(
      '99.5',
      TwentyfourFiveMarketStatus.POST_MARKET,
      nsAtAge(4000),
    )
    setupMock(regularData, extendedData, null)

    await expect(
      getPrice('', requester, regularStreamId, extendedStreamId, undefined, undefined, {
        extended: 30,
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 503,
        message: expect.stringMatching(/extended STALE/),
      }),
    )
  })

  it('rejects with 503 when the active overnight stream is stale', async () => {
    const regularData = createStreamData('100.5', TwentyfourFiveMarketStatus.UNKNOWN, nsAtAge(4000))
    const extendedData = createStreamData('99.5', TwentyfourFiveMarketStatus.UNKNOWN, nsAtAge(4000))
    const overnightData = createStreamData(
      '98.5',
      TwentyfourFiveMarketStatus.OVERNIGHT,
      nsAtAge(4000),
    )
    setupMock(regularData, extendedData, overnightData)

    await expect(
      getPrice('', requester, regularStreamId, extendedStreamId, overnightStreamId, undefined, {
        overnight: 30,
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 503,
        message: expect.stringMatching(/overnight STALE/),
      }),
    )
  })

  it('does not fail over to a fresh stream of a different session type', async () => {
    // Regular says REGULAR but is stale; extended says POST_MARKET and is fresh. The mixed
    // statuses mean the market phase itself is ambiguous — we must reject, not silently switch
    // pricing source to the extended stream.
    const regularData = createStreamData('100.5', TwentyfourFiveMarketStatus.REGULAR, nsAtAge(4000))
    const extendedData = createStreamData(
      '99.5',
      TwentyfourFiveMarketStatus.POST_MARKET,
      nsAtAge(5),
    )
    setupMock(regularData, extendedData, null)

    await expect(
      getPrice('', requester, regularStreamId, extendedStreamId, undefined, undefined, {
        regular: 30,
        extended: 30,
      }),
    ).rejects.toThrow(AdapterError)
  })

  it('treats age == threshold as fresh and age > threshold as stale', async () => {
    const atThreshold = createStreamData('100.5', TwentyfourFiveMarketStatus.REGULAR, nsAtAge(30))
    setupMock(atThreshold, null, null)

    const result = await getPrice('', requester, regularStreamId, undefined, undefined, undefined, {
      regular: 30,
    })
    expect(result.price).toEqual(atThreshold.mid)

    const pastThreshold = createStreamData(
      '100.5',
      TwentyfourFiveMarketStatus.REGULAR,
      nsAtAge(30.001),
    )
    setupMock(pastThreshold, null, null)

    await expect(
      getPrice('', requester, regularStreamId, undefined, undefined, undefined, { regular: 30 }),
    ).rejects.toThrow(expect.objectContaining({ statusCode: 503 }))
  })

  it('passes stale reports through when no thresholds are configured (disabled)', async () => {
    const regularData = createStreamData(
      '100.5',
      TwentyfourFiveMarketStatus.REGULAR,
      nsAtAge(99999),
    )
    setupMock(regularData, null, null)

    const result = await getPrice('', requester, regularStreamId)

    expect(result.price).toEqual(regularData.mid)
  })

  it('only applies the threshold to the stream it is configured for', async () => {
    // Overnight is stale but only the regular threshold is set: overnight must not be rejected
    // for staleness (its marketStatus is what excludes it here).
    const regularData = createStreamData('100.5', TwentyfourFiveMarketStatus.REGULAR, nsAtAge(5))
    const overnightData = createStreamData(
      '98.5',
      TwentyfourFiveMarketStatus.UNKNOWN,
      nsAtAge(99999),
    )
    setupMock(regularData, null, overnightData)

    const result = await getPrice(
      '',
      requester,
      regularStreamId,
      undefined,
      overnightStreamId,
      undefined,
      { regular: 30 },
    )

    expect(result.price).toEqual(regularData.mid)
  })
})
