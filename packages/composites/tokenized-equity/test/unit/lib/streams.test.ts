import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { getPrice } from '../../../src/lib/streams'

const mockGetDeutscheBoersePrice = jest.fn()

jest.mock('@chainlink/data-engine-adapter', () => ({
  getDeutscheBoersePrice: (
    feedId: string,
    url: string,
    requester: Requester,
    options?: { maxAgeInSeconds?: number },
  ) => mockGetDeutscheBoersePrice(feedId, url, requester, options),
}))

describe('getPrice', () => {
  const regularStreamId = 'regular-stream'
  const extendedStreamId = 'extended-stream'
  const overnightStreamId = 'overnight-stream'

  const createStreamData = (
    mid: string,
    marketStatus: TwentyfourFiveMarketStatus,
    decimals: number,
  ) => ({
    mid,
    decimals,
    marketStatus,
    lastSeenTimestampNs: '123456789',
    bid: '100',
    bidVolume: 1000,
    ask: '101',
    askVolume: 2000,
    lastTradedPrice: '102.0',
  })

  const setupMock = (regularData: unknown, extendedData: unknown, overnightData: unknown) => {
    mockGetDeutscheBoersePrice.mockImplementation((streamId: string) => {
      if (streamId === regularStreamId) {
        return regularData === null
          ? Promise.reject(new Error('regular stream error'))
          : Promise.resolve(regularData)
      } else if (streamId === extendedStreamId) {
        return extendedData === null
          ? Promise.reject(new Error('extended stream error'))
          : Promise.resolve(extendedData)
      } else if (streamId === overnightStreamId) {
        return overnightData === null
          ? Promise.reject(new Error('overnight stream error'))
          : Promise.resolve(overnightData)
      }
      return Promise.reject(new Error(`Unexpected streamId: ${streamId}`))
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('regular', async () => {
    const regularData = createStreamData('100.5', TwentyfourFiveMarketStatus.REGULAR, 2)
    const extendedData = createStreamData('99.5', TwentyfourFiveMarketStatus.UNKNOWN, 3)
    const overnightData = createStreamData('98.5', TwentyfourFiveMarketStatus.UNKNOWN, 4)

    setupMock(regularData, extendedData, overnightData)

    const result = await getPrice(
      '',
      {} as any,
      regularStreamId,
      extendedStreamId,
      overnightStreamId,
    )

    expect(result).toEqual({
      price: regularData.mid,
      spread: 1n,
      decimals: regularData.decimals,
      data: {
        regular: regularData,
        extended: extendedData,
        overnight: overnightData,
      },
    })
  })

  it('PRE_MARKET', async () => {
    const regularData = createStreamData('100.5', TwentyfourFiveMarketStatus.UNKNOWN, 2)
    const extendedData = createStreamData('99.5', TwentyfourFiveMarketStatus.PRE_MARKET, 3)
    const overnightData = createStreamData('98.5', TwentyfourFiveMarketStatus.UNKNOWN, 4)

    setupMock(regularData, extendedData, overnightData)

    const result = await getPrice(
      '',
      {} as any,
      regularStreamId,
      extendedStreamId,
      overnightStreamId,
    )

    expect(result).toEqual({
      price: extendedData.mid,
      spread: 1n,
      decimals: extendedData.decimals,
      data: {
        regular: regularData,
        extended: extendedData,
        overnight: overnightData,
      },
    })
  })

  it('POST_MARKET', async () => {
    const regularData = createStreamData('100.5', TwentyfourFiveMarketStatus.UNKNOWN, 2)
    const extendedData = createStreamData('99.5', TwentyfourFiveMarketStatus.POST_MARKET, 3)
    const overnightData = createStreamData('98.5', TwentyfourFiveMarketStatus.UNKNOWN, 4)

    setupMock(regularData, extendedData, overnightData)

    const result = await getPrice(
      '',
      {} as any,
      regularStreamId,
      extendedStreamId,
      overnightStreamId,
    )

    expect(result).toEqual({
      price: extendedData.mid,
      spread: 1n,
      decimals: extendedData.decimals,
      data: {
        regular: regularData,
        extended: extendedData,
        overnight: overnightData,
      },
    })
  })

  it('OVERNIGHT', async () => {
    const regularData = createStreamData('100.5', TwentyfourFiveMarketStatus.UNKNOWN, 2)
    const extendedData = createStreamData('99.5', TwentyfourFiveMarketStatus.UNKNOWN, 3)
    const overnightData = createStreamData('98.5', TwentyfourFiveMarketStatus.OVERNIGHT, 4)

    setupMock(regularData, extendedData, overnightData)

    const result = await getPrice(
      '',
      {} as any,
      regularStreamId,
      extendedStreamId,
      overnightStreamId,
    )

    expect(result).toEqual({
      price: overnightData.mid,
      spread: 1n,
      decimals: overnightData.decimals,
      data: {
        regular: regularData,
        extended: extendedData,
        overnight: overnightData,
      },
    })
  })

  it('passes maxAgeInSeconds option to getDeutscheBoersePrice', async () => {
    const regularData = createStreamData('100.5', TwentyfourFiveMarketStatus.REGULAR, 2)
    const extendedData = createStreamData('99.5', TwentyfourFiveMarketStatus.UNKNOWN, 3)
    const overnightData = createStreamData('98.5', TwentyfourFiveMarketStatus.UNKNOWN, 4)

    setupMock(regularData, extendedData, overnightData)

    const maxAge = 300
    await getPrice(
      'http://test-url',
      {} as any,
      regularStreamId,
      extendedStreamId,
      overnightStreamId,
      maxAge,
    )

    expect(mockGetDeutscheBoersePrice).toHaveBeenCalledTimes(3)
    expect(mockGetDeutscheBoersePrice).toHaveBeenCalledWith(
      regularStreamId,
      'http://test-url',
      expect.anything(),
      {},
    )
    expect(mockGetDeutscheBoersePrice).toHaveBeenCalledWith(
      extendedStreamId,
      'http://test-url',
      expect.anything(),
      {},
    )
    expect(mockGetDeutscheBoersePrice).toHaveBeenCalledWith(
      overnightStreamId,
      'http://test-url',
      expect.anything(),
      { maxAgeInSeconds: maxAge },
    )
  })

  it('passes undefined maxAgeInSeconds when not provided', async () => {
    const regularData = createStreamData('100.5', TwentyfourFiveMarketStatus.REGULAR, 2)
    const extendedData = createStreamData('99.5', TwentyfourFiveMarketStatus.UNKNOWN, 3)
    const overnightData = createStreamData('98.5', TwentyfourFiveMarketStatus.UNKNOWN, 4)

    setupMock(regularData, extendedData, overnightData)

    await getPrice('', {} as any, regularStreamId, extendedStreamId, overnightStreamId)

    expect(mockGetDeutscheBoersePrice).toHaveBeenCalledTimes(3)
    expect(mockGetDeutscheBoersePrice).toHaveBeenCalledWith(
      regularStreamId,
      '',
      expect.anything(),
      {},
    )
    expect(mockGetDeutscheBoersePrice).toHaveBeenCalledWith(
      extendedStreamId,
      '',
      expect.anything(),
      {},
    )
    expect(mockGetDeutscheBoersePrice).toHaveBeenCalledWith(
      overnightStreamId,
      '',
      expect.anything(),
      { maxAgeInSeconds: undefined },
    )
  })

  it('succeeds in regular hours when overnight stream fails', async () => {
    const regularData = createStreamData('100.5', TwentyfourFiveMarketStatus.REGULAR, 2)
    const extendedData = createStreamData('99.5', TwentyfourFiveMarketStatus.REGULAR, 3)

    setupMock(regularData, extendedData, null)

    const result = await getPrice(
      '',
      {} as any,
      regularStreamId,
      extendedStreamId,
      overnightStreamId,
    )

    expect(result).toEqual({
      price: regularData.mid,
      spread: 1n,
      decimals: regularData.decimals,
      data: {
        regular: regularData,
        extended: extendedData,
        overnight: undefined,
      },
    })
  })

  it('errors in overnight hours when overnight stream fails', async () => {
    const regularData = createStreamData('100.5', TwentyfourFiveMarketStatus.OVERNIGHT, 2)
    const extendedData = createStreamData('99.5', TwentyfourFiveMarketStatus.OVERNIGHT, 3)

    setupMock(regularData, extendedData, null)

    const error = await getPrice(
      '',
      {} as any,
      regularStreamId,
      extendedStreamId,
      overnightStreamId,
    ).catch((e) => e)

    expect(error).toBeInstanceOf(AdapterError)
    expect(error.message).toContain('Market is not open')
  })

  it('error', async () => {
    const regularData = createStreamData('100.5', TwentyfourFiveMarketStatus.UNKNOWN, 2)
    const extendedData = createStreamData('99.5', TwentyfourFiveMarketStatus.WEEKEND, 3)
    const overnightData = createStreamData('98.5', TwentyfourFiveMarketStatus.UNKNOWN, 4)

    setupMock(regularData, extendedData, overnightData)

    const error = await getPrice(
      '',
      {} as any,
      regularStreamId,
      extendedStreamId,
      overnightStreamId,
    ).catch((e) => e)

    expect(error).toBeInstanceOf(AdapterError)
    expect(error.message).toContain('Market is not open')
  })
})
