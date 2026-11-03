import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { JsonRpcProvider } from 'ethers'
import { robinhood } from '../../../src/issuers'
import { getDataEngineResult } from '../../../src/lib/dataEngine'
import { scaleDecimals } from '../../../src/lib/decimals'
import { calculatePrice, calculateRawPrice } from '../../../src/transport/issuerPrice247Price'

jest.mock('../../../src/lib/dataEngine', () => ({ getDataEngineResult: jest.fn() }))
const mockGetDataEngineResult = getDataEngineResult as jest.MockedFunction<
  typeof getDataEngineResult
>

describe('scaleDecimals', () => {
  it('scales down with truncation', () => {
    expect(scaleDecimals(123456789n, 6, 2)).toBe(12345n)
  })

  it('scales up', () => {
    expect(scaleDecimals(12n, 2, 6)).toBe(120000n)
  })

  it('keeps value when decimals match', () => {
    expect(scaleDecimals(12n, 4, 4)).toBe(12n)
  })
})

describe('calculateRawPrice', () => {
  const data = {
    mid: '1',
    lastSeenTimestampNs: '2',
    bid: '3',
    bidVolume: 4,
    ask: '5',
    askVolume: 6,
    lastTradedPrice: '7',
    marketStatus: 4,
    decimals: 18,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns the stream price requested in the output decimals', async () => {
    mockGetDataEngineResult.mockResolvedValue({ result: '32398429239', data })
    const param = {
      url: 'http://data-engine',
      requester: {} as Requester,
      targetEndpoint: 'v11' as const,
      feedId: '0x000b',
      resultPath: 'lastTradedPrice' as const,
      decimals: 8,
    }

    expect(await calculateRawPrice(param)).toEqual({
      result: '32398429239',
      decimals: 8,
      rawPrice: '32398429239',
      rawPriceDecimals: 8,
      dataEngine: data,
    })
    expect(mockGetDataEngineResult).toHaveBeenCalledWith(param)
  })
})

describe('calculatePrice', () => {
  const data = {
    mid: '1',
    lastSeenTimestampNs: '2',
    bid: '3',
    bidVolume: 4,
    ask: '5',
    askVolume: 6,
    lastTradedPrice: '7',
    marketStatus: 4,
    decimals: 18,
  }

  const param = {
    url: 'http://data-engine',
    requester: {} as Requester,
    provider: {} as JsonRpcProvider,
    targetEndpoint: 'v11' as const,
    feedId: '0x000b',
    resultPath: 'lastTradedPrice' as const,
    decimals: 8,
    issuer: robinhood,
    multiplier: { asset: '0xa', network: 'mainnet' },
  }

  let readSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    readSpy = jest.spyOn(robinhood, 'read')
  })

  afterEach(() => {
    readSpy.mockRestore()
  })

  it('requests the price in the 18 multiplier decimals', async () => {
    mockGetDataEngineResult.mockResolvedValue({ result: '325000000000000000000', data })
    readSpy.mockResolvedValue({ multiplier: 2n * 10n ** 18n, paused: false })

    const result = await calculatePrice(param)

    expect(mockGetDataEngineResult).toHaveBeenCalledWith(expect.objectContaining({ decimals: 18 }))
    expect(readSpy).toHaveBeenCalledWith(param.multiplier, param.provider)
    expect(result).toEqual({
      result: '65000000000',
      decimals: 8,
      rawPrice: '325000000000000000000',
      rawPriceDecimals: 18,
      rawMultipliedPrice: (650n * 10n ** 36n).toString(),
      rawMultipliedPriceDecimals: 36,
      dataEngine: data,
      multiplier: {
        issuer: 'robinhood',
        network: 'mainnet',
        value: '2000000000000000000',
        decimals: 18,
        paused: false,
      },
    })
  })

  it('applies output decimals after multiplying', async () => {
    // Live robinhood GOOGL values: scaling the price to 8 decimals before
    // multiplying truncates twice and returns 32404712085
    mockGetDataEngineResult.mockResolvedValue({ result: '323984292398371634149', data })
    readSpy.mockResolvedValue({ multiplier: 1000193924414112587n, paused: false })

    const result = await calculatePrice(param)
    expect(result.result).toBe('32404712086')
    expect(result.rawMultipliedPrice).toBe(
      (323984292398371634149n * 1000193924414112587n).toString(),
    )
    expect(result.rawMultipliedPriceDecimals).toBe(36)
  })

  it('scales up when output decimals exceed the product decimals', async () => {
    mockGetDataEngineResult.mockResolvedValue({ result: '15' + '0'.repeat(17), data })
    readSpy.mockResolvedValue({ multiplier: 2n * 10n ** 18n, paused: false })

    const result = await calculatePrice({ ...param, decimals: 40 })
    expect(result.result).toBe('3' + '0'.repeat(40))
  })
})
