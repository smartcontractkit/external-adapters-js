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

jest.mock('../../../src/lib/smoother/smoother', () => {
  const mockProcessUpdate = jest.fn()
  return {
    SessionAwareSmoother: jest.fn().mockImplementation(() => ({
      processUpdate: mockProcessUpdate,
    })),
    __mockProcessUpdate: mockProcessUpdate,
  }
})
const mockSmootherModule = jest.requireMock('../../../src/lib/smoother/smoother') as {
  __mockProcessUpdate: jest.MockedFunction<
    (
      rawPrice: bigint,
      spread: bigint,
      secondsFromTransition: number,
    ) => {
      price: bigint
      x: bigint
      p: bigint
    }
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
    smoother: 'kalman',
    decimals: 8,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('successful calculation', () => {
    it('price.decimals == target decimals', async () => {
      const streams = {
        regular: {
          mid: '1',
          lastSeenTimestampNs: '2',
          bid: '0.99',
          bidVolume: 100,
          ask: '1.01',
          askVolume: 100,
          lastTradedPrice: '1.00',
          marketStatus: 1,
          decimals: 18,
        },
        extended: {
          mid: '10',
          lastSeenTimestampNs: '20',
          bid: '9.9',
          bidVolume: 1000,
          ask: '10.1',
          askVolume: 1000,
          lastTradedPrice: '10.0',
          marketStatus: 2,
          decimals: 18,
        },
        overnight: {
          mid: '100',
          lastSeenTimestampNs: '200',
          bid: '99',
          bidVolume: 10000,
          ask: '101',
          askVolume: 10000,
          lastTradedPrice: '100',
          marketStatus: 3,
          decimals: 18,
        },
      }
      mockGetPrice.mockResolvedValue({
        price: '1',
        spread: 2n,
        decimals: 6,
        data: {
          regular: streams.regular,
          extended: streams.extended,
          overnight: streams.overnight,
        },
      })

      mockGetRegistryData.mockResolvedValue({
        multiplier: 5n * 10n ** 18n,
        paused: false,
      })

      mockCalculateSecondsFromTransition.mockReturnValue(0)
      mockProcessUpdate.mockReturnValue({ price: 1n, x: 2n, p: 3n })

      const result = await calculatePrice({
        ...defaultParams,
        decimals: 6,
      })

      expect(result).toStrictEqual({
        result: '5',
        rawPrice: '1',
        decimals: 6,
        registry: { sValue: '5000000000000000000', paused: false },
        stream: streams,
        smoother: {
          price: '1',
          x: '2',
          p: '3',
          secondsFromTransition: 0,
        },
      })
    })

    it('price.decimals > target decimals', async () => {
      mockGetPrice.mockResolvedValue({
        price: '10',
        spread: 2n,
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

      mockCalculateSecondsFromTransition.mockReturnValue(0)
      mockProcessUpdate.mockReturnValue({ price: 10n, x: 1n, p: 2n })

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
        spread: 2n,
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

      mockCalculateSecondsFromTransition.mockReturnValue(0)
      mockProcessUpdate.mockReturnValue({ price: 1n, x: 2n, p: 3n })

      const result = await calculatePrice({
        ...defaultParams,
        decimals: 7,
      })

      expect(result.result).toEqual('50')
      expect(result.decimals).toEqual(7)
    })
  })
})
