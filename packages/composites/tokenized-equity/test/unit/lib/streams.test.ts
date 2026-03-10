import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { getPrice } from '../../../src/lib/streams'

const mockGetDeutscheBoersePrice = jest.fn()

jest.mock('@chainlink/data-engine-adapter', () => ({
  getDeutscheBoersePrice: (id: string) => mockGetDeutscheBoersePrice(id),
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
        return Promise.resolve(regularData)
      } else if (streamId === extendedStreamId) {
        return Promise.resolve(extendedData)
      } else if (streamId === overnightStreamId) {
        return Promise.resolve(overnightData)
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
      regularStreamId,
      extendedStreamId,
      overnightStreamId,
      '',
      {} as any,
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
      regularStreamId,
      extendedStreamId,
      overnightStreamId,
      '',
      {} as any,
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
      regularStreamId,
      extendedStreamId,
      overnightStreamId,
      '',
      {} as any,
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
      regularStreamId,
      extendedStreamId,
      overnightStreamId,
      '',
      {} as any,
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

  it('error', async () => {
    const regularData = createStreamData('100.5', TwentyfourFiveMarketStatus.UNKNOWN, 2)
    const extendedData = createStreamData('99.5', TwentyfourFiveMarketStatus.WEEKEND, 3)
    const overnightData = createStreamData('98.5', TwentyfourFiveMarketStatus.UNKNOWN, 4)

    setupMock(regularData, extendedData, overnightData)

    const error = await getPrice(
      regularStreamId,
      extendedStreamId,
      overnightStreamId,
      '',
      {} as any,
    ).catch((e) => e)

    expect(error).toBeInstanceOf(AdapterError)
    expect(error.message).toContain('Market is not open')
  })
})
