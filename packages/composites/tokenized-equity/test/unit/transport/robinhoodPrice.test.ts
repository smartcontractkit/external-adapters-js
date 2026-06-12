import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { JsonRpcProvider } from 'ethers'
import { getRegistryData } from '../../../src/lib/registry'
import { calculatePrice } from '../../../src/transport/ondoPrice'
import { smoothedStreamPrice } from '../../../src/transport/smoothedPrice'

jest.mock('../../../src/transport/smoothedPrice', () => ({ smoothedStreamPrice: jest.fn() }))
const mockSmoothedStreamPrice = smoothedStreamPrice as jest.MockedFunction<
  typeof smoothedStreamPrice
>

jest.mock('../../../src/lib/registry', () => ({ getRegistryData: jest.fn() }))
const mockGetRegistryData = getRegistryData as jest.MockedFunction<typeof getRegistryData>

describe('calculatePrice', () => {
  const defaultParams = {
    asset: 'USDC',
    registry: '0x1234567890123456789012345678901234567890',
    provider: {} as JsonRpcProvider,
    regularStreamId: 'regular-stream-id',
    extendedStreamId: 'extended-stream-id',
    overnightStreamId: 'overnight-stream-id',
    url: 'https://api.example.com',
    tradingHoursUrl: 'https://trading-hours.example.com',
    requester: {} as Requester,
    sessionBoundaries: ['09:00', '17:00'],
    sessionBoundariesTimeZone: 'America/New_York',
    sessionMarket: 'nyse',
    sessionMarketType: '24/5',
    decimals: 8,
  }

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

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('scales result', async () => {
    const smoothedStreamPriceReturn = [
      {
        result: 1n,
        rawPrice: '1',
        decimals: 6,
        stream: streams,
        smoother: {
          smoother: 'ema' as const,
          price: '1',
          x: '2',
          p: '3',
          secondsFromTransition: 0,
        },
        sessionSource: 'FALLBACK' as const,
      },
      {
        result: 1n,
        rawPrice: '1',
        decimals: 6,
        stream: streams,
        smoother: {
          smoother: 'kalman' as const,
          price: '1',
          x: '2',
          p: '3',
          secondsFromTransition: 0,
        },
        sessionSource: 'FALLBACK' as const,
      },
    ]

    mockSmoothedStreamPrice.mockResolvedValue(smoothedStreamPriceReturn)
    mockGetRegistryData.mockResolvedValue({
      multiplier: 5n * 10n ** 18n,
      paused: false,
    })

    const result = await calculatePrice({
      ...defaultParams,
      smoother: 'kalman',
      decimals: 6,
    })

    const expectedRegistry = { sValue: '5000000000000000000', paused: false }
    expect(result[0]).toStrictEqual({
      ...smoothedStreamPriceReturn[0],
      registry: expectedRegistry,
      result: '5',
    })
    expect(result[1]).toStrictEqual({
      ...smoothedStreamPriceReturn[1],
      registry: expectedRegistry,
      result: '5',
    })
  })

  it('throws when registry is paused', async () => {
    mockSmoothedStreamPrice.mockResolvedValue([
      {
        result: 1n,
        rawPrice: '1',
        decimals: 6,
        stream: streams,
        smoother: {
          smoother: 'ema' as const,
          price: '1',
          x: '0',
          p: '0',
          secondsFromTransition: 0,
        },
        sessionSource: 'FALLBACK' as const,
      },
      {
        result: 1n,
        rawPrice: '1',
        decimals: 6,
        stream: streams,
        smoother: {
          smoother: 'kalman' as const,
          price: '1',
          x: '0',
          p: '0',
          secondsFromTransition: 0,
        },
        sessionSource: 'FALLBACK' as const,
      },
    ])
    mockGetRegistryData.mockResolvedValue({
      multiplier: 5n * 10n ** 18n,
      paused: true,
    })

    await expect(
      calculatePrice({
        ...defaultParams,
        smoother: 'kalman',
        decimals: 6,
      }),
    ).rejects.toMatchObject({
      statusCode: 503,
      message: 'asset: USDC paused on registry 0x1234567890123456789012345678901234567890',
    })
  })
})
