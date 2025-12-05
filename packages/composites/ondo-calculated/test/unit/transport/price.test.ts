import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { JsonRpcProvider } from 'ethers'
import { getRegistryData } from '../../../src/lib/registry'
import { calculateSecondsFromTransition } from '../../../src/lib/session'
import { getPrice } from '../../../src/lib/streams'
import { calculatePrice } from '../../../src/transport/price'

jest.mock('../../../src/lib/streams', () => ({ getPrice: jest.fn() }))
const mockGetPrice = getPrice as jest.MockedFunction<typeof getPrice>

jest.mock('../../../src/lib/registry', () => ({ getRegistryData: jest.fn() }))
const mockGetRegistryData = getRegistryData as jest.MockedFunction<typeof getRegistryData>

jest.mock('../../../src/lib/smoother', () => {
  const mockProcessUpdate = jest.fn()
  return {
    SessionAwareSmoother: jest.fn().mockImplementation(() => ({
      processUpdate: mockProcessUpdate,
    })),
    __mockProcessUpdate: mockProcessUpdate,
  }
})
const mockSmootherModule = jest.requireMock('../../../src/lib/smoother') as {
  __mockProcessUpdate: jest.MockedFunction<
    (rawPrice: bigint, secondsFromTransition: number) => bigint
  >
}
const mockProcessUpdate = mockSmootherModule.__mockProcessUpdate

jest.mock('../../../src/lib/session', () => ({ calculateSecondsFromTransition: jest.fn() }))
const mockCalculateSecondsFromTransition = calculateSecondsFromTransition as jest.MockedFunction<
  typeof calculateSecondsFromTransition
>

describe('calculatePrice', () => {
  const defaultParams = {
    asset: 'USDC',
    registry: '0x1234567890123456789012345678901234567890',
    provider: {} as JsonRpcProvider,
    regularStreamId: 'regular-stream-id',
    extendedStreamId: 'extended-stream-id',
    overnightStreamId: 'overnight-stream-id',
    url: 'https://api.example.com',
    requester: {} as Requester,
    sessionBoundaries: ['09:00', '17:00'],
    sessionBoundariesTimeZone: 'America/New_York',
    decimals: 8,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('successful calculation', () => {
    it('price.decimals == target decimals', async () => {
      mockGetPrice.mockResolvedValue({
        price: '1',
        decimals: 6,
        marketStatus: 'REGULAR' as any,
        data: {
          regular: {} as any,
          extended: {} as any,
          overnight: {} as any,
        },
      })

      mockGetRegistryData.mockResolvedValue({
        multiplier: 5n * 10n ** 18n,
        paused: false,
      })

      mockCalculateSecondsFromTransition.mockReturnValue(0)
      mockProcessUpdate.mockReturnValue(1n)

      const result = await calculatePrice(
        defaultParams.asset,
        defaultParams.registry,
        defaultParams.provider,
        defaultParams.regularStreamId,
        defaultParams.extendedStreamId,
        defaultParams.overnightStreamId,
        defaultParams.url,
        defaultParams.requester,
        defaultParams.sessionBoundaries,
        defaultParams.sessionBoundariesTimeZone,
        6,
      )

      expect(result.result).toEqual('5')
    })

    it('price.decimals > target decimals', async () => {
      mockGetPrice.mockResolvedValue({
        price: '10',
        decimals: 7,
        marketStatus: 'REGULAR' as any,
        data: {
          regular: {} as any,
          extended: {} as any,
          overnight: {} as any,
        },
      })

      mockGetRegistryData.mockResolvedValue({
        multiplier: 5n * 10n ** 18n,
        paused: false,
      })

      mockCalculateSecondsFromTransition.mockReturnValue(0)
      mockProcessUpdate.mockReturnValue(10n)

      const result = await calculatePrice(
        defaultParams.asset,
        defaultParams.registry,
        defaultParams.provider,
        defaultParams.regularStreamId,
        defaultParams.extendedStreamId,
        defaultParams.overnightStreamId,
        defaultParams.url,
        defaultParams.requester,
        defaultParams.sessionBoundaries,
        defaultParams.sessionBoundariesTimeZone,
        6,
      )

      expect(result.result).toEqual('5')
      expect(result.decimals).toEqual(6)
    })

    it('price.decimals < target decimals', async () => {
      mockGetPrice.mockResolvedValue({
        price: '1',
        decimals: 6,
        marketStatus: 'REGULAR' as any,
        data: {
          regular: {} as any,
          extended: {} as any,
          overnight: {} as any,
        },
      })

      mockGetRegistryData.mockResolvedValue({
        multiplier: 5n * 10n ** 18n,
        paused: false,
      })

      mockCalculateSecondsFromTransition.mockReturnValue(0)
      mockProcessUpdate.mockReturnValue(1n)

      const result = await calculatePrice(
        defaultParams.asset,
        defaultParams.registry,
        defaultParams.provider,
        defaultParams.regularStreamId,
        defaultParams.extendedStreamId,
        defaultParams.overnightStreamId,
        defaultParams.url,
        defaultParams.requester,
        defaultParams.sessionBoundaries,
        defaultParams.sessionBoundariesTimeZone,
        7,
      )

      expect(result.result).toEqual('50')
      expect(result.decimals).toEqual(7)
    })
  })
})
