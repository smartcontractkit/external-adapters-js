import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { getDataEngineResult } from '../../../src/lib/dataEngine'

describe('getDataEngineResult', () => {
  const mockRequest = jest.fn()
  const requester = { request: mockRequest } as unknown as Requester

  const param = {
    url: 'http://data-engine',
    requester,
    targetEndpoint: 'v11' as const,
    feedId: '0x000b',
    resultPath: 'lastTradedPrice' as const,
    decimals: 8,
  }

  const data = {
    mid: '1',
    lastSeenTimestampNs: '2',
    bid: '3',
    bidVolume: 4,
    ask: '5',
    askVolume: 6,
    lastTradedPrice: '323984292398371634149',
    marketStatus: 5,
    decimals: 18,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('requests the data-engine v11 endpoint and scales resultPath with truncation', async () => {
    mockRequest.mockResolvedValue({ response: { data: { data } } })

    expect(await getDataEngineResult(param)).toEqual({ result: '32398429239', data })

    expect(mockRequest).toHaveBeenCalledWith(expect.any(String), {
      baseURL: 'http://data-engine',
      method: 'POST',
      data: {
        data: {
          endpoint: 'deutscheBoerse-v11',
          feedId: '0x000b',
        },
      },
    })
  })

  it('scales from the report decimals', async () => {
    mockRequest.mockResolvedValue({
      response: { data: { data: { ...data, lastTradedPrice: '325', decimals: 0 } } },
    })

    expect((await getDataEngineResult(param)).result).toBe('32500000000')
  })

  it('throws 400 when resultPath is not in the report', async () => {
    mockRequest.mockResolvedValue({
      response: { data: { data: { ...data, lastTradedPrice: undefined } } },
    })

    await expect(getDataEngineResult(param)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining("resultPath 'lastTradedPrice' not found in data"),
    })
  })

  it('propagates the data-engine status code', async () => {
    mockRequest.mockResolvedValue({ response: { data: { statusCode: 504 } } })

    await expect(getDataEngineResult(param)).rejects.toMatchObject({ statusCode: 504 })
  })
})
