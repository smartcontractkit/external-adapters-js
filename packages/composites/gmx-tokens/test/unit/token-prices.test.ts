import type { FeedDataResult } from '@chainlink/data-engine-adapter'
import { getFeedData } from '@chainlink/data-engine-adapter'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterDataProviderError } from '@chainlink/external-adapter-framework/validation/error'
import { ethers } from 'ethers'
import {
  dataStreamIdKey,
  fetchMedianPricesForAssets,
} from '../../src/transport/shared/token-prices'
import { calculateMedianLwbaPrices } from '../../src/transport/shared/utils'

jest.mock('@chainlink/data-engine-adapter', () => ({
  getFeedData: jest.fn(),
}))

describe('fetchMedianPricesForAssets', () => {
  const dataEngineUrl = 'http://data-engine.test'
  const requester = {} as Requester
  const mockGetFeedData = jest.mocked(getFeedData)
  const LINK_ADDRESS = '0xf97f4df75117a78c1a5a0dbb814af92458539fb4'
  const USDC_ADDRESS = '0xaf88d065e77c8cc2239327c5edb3a432268e5831'

  const buildDataStoreMock = (overrides: Record<string, string> = {}) => {
    const defaultMap: Record<string, string> = {
      [dataStreamIdKey(LINK_ADDRESS).toLowerCase()]: '0xfeedlink',
      [dataStreamIdKey(USDC_ADDRESS).toLowerCase()]: '0xfeedusdc',
    }
    const lookup = { ...defaultMap, ...overrides }
    return {
      getBytes32: jest.fn(async (key: string) => lookup[key.toLowerCase()] ?? ethers.ZeroHash),
    } as any
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('throws if DATA_ENGINE_ADAPTER_URL is missing', async () => {
    await expect(
      fetchMedianPricesForAssets({
        assets: [{ symbol: 'LINK', address: LINK_ADDRESS }],
        requester,
        dataEngineUrl: undefined,
        dataStoreContract: buildDataStoreMock(),
        dataRequestedTimestamp: Date.now(),
      }),
    ).rejects.toThrow('DATA_ENGINE_ADAPTER_URL must be set')
  })

  it('aggregates median values and source metadata on success', async () => {
    const responses: Record<string, FeedDataResult> = {
      '0xfeedlink': {
        version: 'V3',
        data: { bid: '2000', ask: '3000', price: '2500', decimals: 3 },
      },
      '0xfeedusdc': {
        version: 'V3',
        data: { bid: '4000', ask: '5000', price: '4500', decimals: 3 },
      },
    }
    mockGetFeedData.mockImplementation(async (feedId) => responses[feedId])

    const onSuccess = jest.fn()

    const result = await fetchMedianPricesForAssets({
      assets: [
        { symbol: 'LINK', address: LINK_ADDRESS, providerKey: 'GLV-LINK' },
        { symbol: 'USDC', address: USDC_ADDRESS },
      ],
      requester,
      dataEngineUrl,
      onSuccess,
      dataStoreContract: buildDataStoreMock(),
      dataRequestedTimestamp: Date.now(),
    })

    expect(mockGetFeedData).toHaveBeenCalledTimes(2)
    expect(result.medianValues).toEqual(
      calculateMedianLwbaPrices(['LINK', 'USDC'], {
        LINK: { bids: [2], asks: [3] },
        USDC: { bids: [4], asks: [5] },
      }),
    )
    expect(result.priceProviders).toEqual({
      'GLV-LINK': ['data-engine'],
      USDC: ['data-engine'],
    })
    expect(onSuccess).toHaveBeenCalledTimes(2)
    expect(onSuccess).toHaveBeenNthCalledWith(1, 'LINK')
    expect(onSuccess).toHaveBeenNthCalledWith(2, 'USDC')
  })

  it('throws with aggregated failures while still resolving successful assets', async () => {
    const rejection = new Error('boom')
    mockGetFeedData.mockImplementation(async (feedId) => {
      if (feedId === '0xdead') {
        throw rejection
      }
      return {
        version: 'V3',
        data: { bid: '1000', ask: '2000', price: '1500', decimals: 3 },
      } as FeedDataResult
    })

    const onError = jest.fn()
    const onSuccess = jest.fn()

    await expect(
      fetchMedianPricesForAssets({
        assets: [
          { symbol: 'LINK', address: LINK_ADDRESS },
          { symbol: 'USDC', address: USDC_ADDRESS },
        ],
        requester,
        dataEngineUrl,
        onError,
        onSuccess,
        dataStoreContract: buildDataStoreMock({
          [dataStreamIdKey(LINK_ADDRESS).toLowerCase()]: '0xdead',
          [dataStreamIdKey(USDC_ADDRESS).toLowerCase()]: '0xbeef',
        }),
        dataRequestedTimestamp: Date.now(),
      }),
    ).rejects.toThrow('Missing responses for assets: LINK')

    expect(mockGetFeedData).toHaveBeenCalledTimes(2)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith('LINK', rejection)
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith('USDC')
  })

  it('wraps datastore lookup errors into AdapterDataProviderError', async () => {
    const dataStoreContract = {
      getBytes32: jest.fn().mockRejectedValue(new Error('boom')),
    }

    await expect(
      fetchMedianPricesForAssets({
        assets: [{ symbol: 'LINK', address: LINK_ADDRESS }],
        requester,
        dataEngineUrl,
        dataStoreContract: dataStoreContract as any,
        dataRequestedTimestamp: 123,
      }),
    ).rejects.toThrow(AdapterDataProviderError)
  })

  it('supports V11 feeds with bid/ask extraction', async () => {
    const responses: Record<string, FeedDataResult> = {
      '0xfeedlink': {
        version: 'V11',
        data: {
          mid: '2500',
          lastSeenTimestampNs: '123',
          bid: '2000',
          bidVolume: 100,
          ask: '3000',
          askVolume: 200,
          lastTradedPrice: '2500',
          marketStatus: 1,
          decimals: 3,
        },
      },
    }
    mockGetFeedData.mockImplementation(async (feedId) => responses[feedId])

    const result = await fetchMedianPricesForAssets({
      assets: [{ symbol: 'LINK', address: LINK_ADDRESS }],
      requester,
      dataEngineUrl,
      dataStoreContract: buildDataStoreMock(),
      dataRequestedTimestamp: Date.now(),
    })

    expect(mockGetFeedData).toHaveBeenCalledTimes(1)
    expect(result.medianValues).toEqual(
      calculateMedianLwbaPrices(['LINK'], {
        LINK: { bids: [2], asks: [3] },
      }),
    )
  })

  it('throws for unsupported report versions', async () => {
    mockGetFeedData.mockResolvedValue({
      version: 'V7',
      data: { exchangeRate: '1000', decimals: 3 },
    } as FeedDataResult)

    await expect(
      fetchMedianPricesForAssets({
        assets: [{ symbol: 'LINK', address: LINK_ADDRESS }],
        requester,
        dataEngineUrl,
        dataStoreContract: buildDataStoreMock(),
        dataRequestedTimestamp: Date.now(),
      }),
    ).rejects.toThrow('Missing responses for assets: LINK')
  })
})
