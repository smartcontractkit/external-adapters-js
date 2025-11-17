import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { request } from '../../src/transport/requester'

describe('requester.ts', () => {
  let mockRequester: jest.Mocked<Requester>

  beforeEach(() => {
    mockRequester = {
      request: jest.fn(),
    } as any
  })

  describe('request function', () => {
    it('should return data from a single page', async () => {
      mockRequester.request.mockResolvedValueOnce({
        response: {
          data: {
            data: [
              { id: 1, value: 'test1' },
              { id: 2, value: 'test2' },
            ],
            page: {
              next: null,
            },
          },
        },
      } as any)

      const result = await request(mockRequester, 'url', 'path', 'key', 100)

      expect(result).toEqual([
        { id: 1, value: 'test1' },
        { id: 2, value: 'test2' },
      ])
    })

    it('should handle pagination across multiple pages', async () => {
      mockRequester.request
        .mockResolvedValueOnce({
          response: {
            data: {
              data: [{ id: 1, value: 'page1' }],
              page: {
                next: 'next1',
              },
            },
          },
        } as any)
        .mockResolvedValueOnce({
          response: {
            data: {
              data: [{ id: 2, value: 'page2' }],
              page: {
                next: 'next2',
              },
            },
          },
        } as any)
        .mockResolvedValueOnce({
          response: {
            data: {
              data: [{ id: 3, value: 'page3' }],
              page: {
                next: null,
              },
            },
          },
        } as any)

      const result = await request(mockRequester, 'url', 'path', 'key', 100)

      expect(result).toEqual([
        { id: 1, value: 'page1' },
        { id: 2, value: 'page2' },
        { id: 3, value: 'page3' },
      ])
    })

    it('should handle empty data array', async () => {
      mockRequester.request.mockResolvedValueOnce({
        response: {
          data: {
            data: [],
            page: {
              next: null,
            },
          },
        },
      } as any)

      const result = await request(mockRequester, 'url', 'path', 'key', 100)

      expect(result).toEqual([])
    })

    it('should throw AdapterError when response is invalid', async () => {
      mockRequester.request.mockResolvedValueOnce(null as any)
      await expect(request(mockRequester, 'url', 'path', 'key', 100)).rejects.toThrow(
        'API urlpath?limit=100 does not return data',
      )

      mockRequester.request.mockResolvedValueOnce({ response: null } as any)
      await expect(request(mockRequester, 'url', 'path', 'key', 100)).rejects.toThrow(
        'API urlpath?limit=100 does not return data',
      )

      mockRequester.request.mockResolvedValueOnce({ response: { data: null } } as any)
      await expect(request(mockRequester, 'url', 'path', 'key', 100)).rejects.toThrow(
        'API urlpath?limit=100 does not return data',
      )
    })
  })
})
