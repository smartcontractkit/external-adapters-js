import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { JsonRpcProvider } from 'ethers'
import { getRegistryData } from '../../../src/lib/registry'
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

      mockProcessUpdate.mockReturnValue(1n)

      const result = await calculatePrice({
        ...defaultParams,
        decimals: 6,
      })

      expect(result.result).toEqual('5')
    })

    it('price.decimals > target decimals', async () => {
      mockGetPrice.mockResolvedValue({
        price: '10',
        decimals: 7,
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

      mockProcessUpdate.mockReturnValue(10n)

      const result = await calculatePrice({
        ...defaultParams,
        decimals: 6,
      })

      expect(result.result).toEqual('5')
      expect(result.decimals).toEqual(6)
    })

    it('price.decimals < target decimals', async () => {
      mockGetPrice.mockResolvedValue({
        price: '1',
        decimals: 6,
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

      mockProcessUpdate.mockReturnValue(1n)

      const result = await calculatePrice({
        ...defaultParams,
        decimals: 7,
      })

      expect(result.result).toEqual('50')
      expect(result.decimals).toEqual(7)
    })
  })
})
