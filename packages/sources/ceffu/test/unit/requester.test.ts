import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { request } from '../../src/transport/requester'

jest.mock('crypto', () => ({
  createPrivateKey: jest.fn(),
  createSign: jest.fn().mockReturnValue({
    write: jest.fn(),
    end: jest.fn(),
    sign: jest.fn().mockReturnValue('mocked-signature'),
  }),
}))

describe('requester.ts', () => {
  let mockRequester: jest.Mocked<Requester>

  beforeEach(() => {
    mockRequester = {
      request: jest.fn(),
    } as any
  })

  describe('request function', () => {
    it('should stop pagination at the end of the page', async () => {
      mockRequester.request
        .mockResolvedValueOnce({
          response: {
            data: {
              data: {
                data: [100],
                totalPage: 3,
                pageNo: 1,
                pageLimit: 500,
              },
              code: '000000',
              message: 'success',
            },
          },
        } as any)
        .mockResolvedValueOnce({
          response: {
            data: {
              data: {
                data: [],
                totalPage: 3,
                pageNo: 2,
                pageLimit: 500,
              },
              code: '000000',
              message: 'success',
            },
          },
        } as any)
        .mockResolvedValueOnce({
          response: {
            data: {
              data: {
                data: [200],
                totalPage: 3,
                pageNo: 3,
                pageLimit: 500,
              },
              code: '000000',
              message: 'success',
            },
          },
        } as any)

      const result = await request('', '', {}, '', '', mockRequester)

      expect(result).toEqual({ data: [100, 200], extra: [] })
      expect(mockRequester.request).toHaveBeenCalledTimes(3)
    })

    it('should return extras', async () => {
      mockRequester.request.mockResolvedValueOnce({
        response: {
          data: {
            data: {
              data: [100],
              extraData: 123,
              totalPage: 1,
              pageNo: 1,
              pageLimit: 500,
            },
            code: '000000',
            message: 'success',
          },
        },
      } as any)

      const result = await request('', '', {}, '', '', mockRequester)

      expect(result).toEqual({ data: [100], extra: [{ extraData: 123 }] })
    })

    it('should throw AdapterError when response is null', async () => {
      mockRequester.request.mockResolvedValueOnce(null as any)
      await expect(request('', '', {}, '', '', mockRequester)).rejects.toThrow(
        'Ceffu wallet API  does not return data',
      )

      mockRequester.request.mockResolvedValueOnce({ response: null } as any)
      await expect(request('', '', {}, '', '', mockRequester)).rejects.toThrow(
        'Ceffu wallet API  does not return data',
      )

      mockRequester.request.mockResolvedValueOnce({ response: { data: null } } as any)
      await expect(request('', '', {}, '', '', mockRequester)).rejects.toThrow(
        'Ceffu wallet API  does not return data',
      )
    })

    it('should throw AdapterError when API returns error code', async () => {
      mockRequester.request.mockResolvedValueOnce({
        response: {
          data: {
            code: '400001',
            message: 'Invalid API key',
          },
        },
      } as any)

      await expect(request('', '', {}, '', '', mockRequester)).rejects.toThrow(
        'Ceffu wallet API  failed, code: 400001, message:Invalid API key',
      )
    })
  })
})
