import { getCryptoPrice, getRwaPrice } from '../../src/lib'

describe('lib.ts', () => {
  it('getCryptoPrice - should return result', async () => {
    const requester = { request: jest.fn() } as any
    const data = { bid: '1', ask: '2', price: '3', decimals: 4 }

    requester.request.mockResolvedValueOnce({ response: { data: { result: null, data: data } } })

    await expect(getCryptoPrice('feed-1', 'ea-url', requester)).resolves.toEqual(data)
  })

  it('getRwaPrice - should return result', async () => {
    const requester = { request: jest.fn() } as any
    const data = { midPrice: '1', marketStatus: 2, decimals: 3 }

    requester.request.mockResolvedValueOnce({ response: { data: { result: null, data: data } } })

    await expect(getRwaPrice('feed-2', 'ea-url', requester)).resolves.toEqual(data)
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
})
