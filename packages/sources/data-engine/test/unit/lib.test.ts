import { getReportVersion } from '@chainlink/data-streams-sdk'
import {
  getCryptoPrice,
  getDeutscheBoersePrice,
  getExchangeRate,
  getFeedData,
  getRwaPrice,
} from '../../src/lib'

jest.mock('@chainlink/data-streams-sdk', () => ({
  getReportVersion: jest.fn(),
}))

const mockGetReportVersion = jest.mocked(getReportVersion)

describe('lib.ts', () => {
  it('getCryptoPrice - should return result', async () => {
    const requester = { request: jest.fn() } as any
    const data = { bid: '1', ask: '2', price: '3', decimals: 4 }

    requester.request.mockResolvedValueOnce({ response: { data: { result: null, data: data } } })

    await expect(
      getCryptoPrice('feed-1', 'ea-url', requester, { maxAgeInSeconds: 60 }),
    ).resolves.toEqual(data)

    expect(requester.request).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        data: {
          data: {
            endpoint: 'crypto-v3',
            feedId: 'feed-1',
            maxAgeInSeconds: 60,
          },
        },
      }),
    )
  })

  it('getRwaPrice - should return result', async () => {
    const requester = { request: jest.fn() } as any
    const data = { midPrice: '1', marketStatus: 2, decimals: 3 }

    requester.request.mockResolvedValueOnce({ response: { data: { result: null, data: data } } })

    await expect(getRwaPrice('feed-2', 'ea-url', requester)).resolves.toEqual(data)
  })

  it('getDeutscheBoersePrice - should return result', async () => {
    const requester = { request: jest.fn() } as any
    const data = {
      mid: '1',
      lastSeenTimestampNs: '2',
      bid: '3',
      bidVolume: 4,
      ask: '5',
      askVolume: 6,
      lastTradedPrice: '7',
      marketStatus: 8,
      decimals: 9,
    }

    requester.request.mockResolvedValueOnce({ response: { data: { result: null, data: data } } })

    await expect(getDeutscheBoersePrice('feed-3', 'ea-url', requester)).resolves.toEqual(data)
  })

  it('getExchangeRate - should return result', async () => {
    const requester = { request: jest.fn() } as any
    const data = { exchangeRate: '1156789000000000000', decimals: 18 }

    requester.request.mockResolvedValueOnce({ response: { data: { result: null, data: data } } })

    await expect(getExchangeRate('feed-4', 'ea-url', requester)).resolves.toEqual(data)
  })

  it('should throw if empty', async () => {
    const requester = { request: jest.fn() } as any

    requester.request.mockResolvedValueOnce({})
    await expect(() => getCryptoPrice('feed-1', 'ea-url', requester)).rejects.toThrow(
      'EA request failed: undefined undefined undefined AdapterError',
    )

    requester.request.mockResolvedValueOnce({ response: {} })
    await expect(() => getCryptoPrice('feed-1', 'ea-url', requester)).rejects.toThrow(
      'EA request failed: undefined undefined undefined AdapterError',
    )

    requester.request.mockResolvedValueOnce({
      response: { data: {}, status: 404, statusText: 'fail' },
    })
    await expect(() => getCryptoPrice('feed-1', 'ea-url', requester)).rejects.toThrow(
      'EA request failed: {} 404 fail AdapterError',
    )

    requester.request.mockResolvedValueOnce({
      response: { data: { result: null }, status: 200, statusText: 'ok' },
    })
    await expect(() => getCryptoPrice('feed-1', 'ea-url', requester)).rejects.toThrow(
      'EA request failed: {"result":null} 200 ok AdapterError',
    )

    requester.request.mockResolvedValueOnce({
      response: { data: { result: { data: null } }, status: 200, statusText: 'ok' },
    })
    await expect(() => getCryptoPrice('feed-1', 'ea-url', requester)).rejects.toThrow(
      'EA request failed: {"result":{"data":null}} 200 ok AdapterError',
    )
  })

  describe('getFeedData', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should route V3 feedId to crypto-v3 endpoint', async () => {
      const requester = { request: jest.fn() } as any
      const data = { bid: '1', ask: '2', price: '3', decimals: 4 }
      mockGetReportVersion.mockReturnValue('V3')
      requester.request.mockResolvedValueOnce({ response: { data: { result: null, data } } })

      const result = await getFeedData('feed-v3', 'ea-url', requester)

      expect(result).toEqual({ version: 'V3', data })
      expect(mockGetReportVersion).toHaveBeenCalledWith('feed-v3')
      expect(requester.request).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          data: { data: { endpoint: 'crypto-v3', feedId: 'feed-v3' } },
        }),
      )
    })

    it('should route V11 feedId to deutscheBoerse-v11 endpoint', async () => {
      const requester = { request: jest.fn() } as any
      const data = {
        mid: '1',
        lastSeenTimestampNs: '2',
        bid: '3',
        bidVolume: 4,
        ask: '5',
        askVolume: 6,
        lastTradedPrice: '7',
        marketStatus: 8,
        decimals: 9,
      }
      mockGetReportVersion.mockReturnValue('V11')
      requester.request.mockResolvedValueOnce({ response: { data: { result: null, data } } })

      const result = await getFeedData('feed-v11', 'ea-url', requester)

      expect(result).toEqual({ version: 'V11', data })
      expect(requester.request).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          data: { data: { endpoint: 'deutscheBoerse-v11', feedId: 'feed-v11' } },
        }),
      )
    })

    it('should route V7 feedId to exchangeRate-v7 endpoint', async () => {
      const requester = { request: jest.fn() } as any
      const data = { exchangeRate: '1156789000000000000', decimals: 18 }
      mockGetReportVersion.mockReturnValue('V7')
      requester.request.mockResolvedValueOnce({ response: { data: { result: null, data } } })

      const result = await getFeedData('feed-v7', 'ea-url', requester)

      expect(result).toEqual({ version: 'V7', data })
      expect(requester.request).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          data: { data: { endpoint: 'exchangeRate-v7', feedId: 'feed-v7' } },
        }),
      )
    })

    it('should route V8 feedId to rwa-v8 endpoint', async () => {
      const requester = { request: jest.fn() } as any
      const data = { midPrice: '1', marketStatus: 2, decimals: 3 }
      mockGetReportVersion.mockReturnValue('V8')
      requester.request.mockResolvedValueOnce({ response: { data: { result: null, data } } })

      const result = await getFeedData('feed-v8', 'ea-url', requester)

      expect(result).toEqual({ version: 'V8', data })
      expect(requester.request).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          data: { data: { endpoint: 'rwa-v8', feedId: 'feed-v8' } },
        }),
      )
    })

    it('should pass maxAgeInSeconds option', async () => {
      const requester = { request: jest.fn() } as any
      const data = { bid: '1', ask: '2', price: '3', decimals: 4 }
      mockGetReportVersion.mockReturnValue('V3')
      requester.request.mockResolvedValueOnce({ response: { data: { result: null, data } } })

      await getFeedData('feed-v3', 'ea-url', requester, { maxAgeInSeconds: 120 })

      expect(requester.request).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          data: { data: { endpoint: 'crypto-v3', feedId: 'feed-v3', maxAgeInSeconds: 120 } },
        }),
      )
    })

    it('should throw for unsupported report version', async () => {
      const requester = { request: jest.fn() } as any
      mockGetReportVersion.mockReturnValue('V99' as any)

      await expect(getFeedData('feed-unknown', 'ea-url', requester)).rejects.toThrow(
        "Unsupported report version 'V99' for feedId 'feed-unknown'",
      )
      expect(requester.request).not.toHaveBeenCalled()
    })
  })
})
