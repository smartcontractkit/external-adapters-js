import { getCryptoPrice } from '@chainlink/data-engine-adapter'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { fetchTokenPrices } from '../../src/transport/shared/token-prices'

jest.mock('@chainlink/data-engine-adapter', () => ({
  getCryptoPrice: jest.fn(),
}))

describe('fetchTokenPrices', () => {
  const dataEngineUrl = 'http://data-engine.test'
  const requester = {} as Requester
  const mockGetCryptoPrice = jest.mocked(getCryptoPrice)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('aggregates price payloads and provider metadata on success', async () => {
    const responses: Record<string, { bid: string; ask: string; decimals: number }> = {
      '0xfeedlink': { bid: '2000', ask: '3000', decimals: 3 },
      '0xfeedusdc': { bid: '4000', ask: '5000', decimals: 3 },
    }
    mockGetCryptoPrice.mockImplementation(async (feedId) => responses[feedId])

    const onSuccess = jest.fn()

    const result = await fetchTokenPrices({
      assets: [
        { key: 'LINK', feedId: '0xfeedlink', providerKey: 'GLV-LINK' },
        { key: 'USDC', feedId: '0xfeedusdc' },
      ],
      requester,
      dataEngineUrl,
      onSuccess,
    })

    expect(mockGetCryptoPrice).toHaveBeenCalledTimes(2)
    expect(result.priceData).toEqual({
      LINK: { bids: [2], asks: [3] },
      USDC: { bids: [4], asks: [5] },
    })
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
    mockGetCryptoPrice.mockImplementation(async (feedId) => {
      if (feedId === '0xdead') {
        throw rejection
      }
      return { bid: '1000', ask: '2000', decimals: 3 }
    })

    const onError = jest.fn()
    const onSuccess = jest.fn()

    await expect(
      fetchTokenPrices({
        assets: [
          { key: 'LINK', feedId: '0xdead' },
          { key: 'USDC', feedId: '0xbeef' },
        ],
        requester,
        dataEngineUrl,
        onError,
        onSuccess,
      }),
    ).rejects.toThrow('Missing responses for assets: LINK')

    expect(mockGetCryptoPrice).toHaveBeenCalledTimes(2)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith('LINK', rejection)
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith('USDC')
  })
})
