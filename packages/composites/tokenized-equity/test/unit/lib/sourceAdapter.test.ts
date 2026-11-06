import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterDataProviderError,
  AdapterError,
} from '@chainlink/external-adapter-framework/validation/error'
import { getMultiplier } from '../../../src/lib/sourceAdapter'

describe('getMultiplier', () => {
  const mockRequest = jest.fn()
  const requester = { request: mockRequest } as unknown as Requester

  const adapter = 'SOLANA_FUNCTIONS'
  const url = 'http://solana-functions'
  const parsedParams = {
    endpoint: 'scaled-ui-amount',
    mint: 'So11111111111111111111111111111111111111112',
  }
  const params = JSON.stringify(parsedParams)

  const multiplierData = {
    multiplier: 1.5,
    activationDateTime: '1762387200',
    newMultiplier: 1.75,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('posts the parsed params to the source adapter and returns the multiplier data', async () => {
    mockRequest.mockResolvedValue({ response: { data: { data: multiplierData } } })

    expect(await getMultiplier(adapter, url, params, requester)).toEqual(multiplierData)

    expect(mockRequest).toHaveBeenCalledTimes(1)
    expect(mockRequest).toHaveBeenCalledWith(expect.any(String), {
      baseURL: url,
      method: 'POST',
      data: { data: parsedParams },
    })
  })

  it('uses the serialized request config as the coalescing key', async () => {
    mockRequest.mockResolvedValue({ response: { data: { data: multiplierData } } })

    await getMultiplier(adapter, url, params, requester)

    const [key, config] = mockRequest.mock.calls[0]
    expect(key).toBe(JSON.stringify(config))
  })

  it('throws 500 with the HTTP status when the response has no body', async () => {
    mockRequest.mockResolvedValue({ response: { status: 502, statusText: 'Bad Gateway' } })

    await expect(getMultiplier(adapter, url, params, requester)).rejects.toMatchObject({
      statusCode: 500,
      message: 'EA SOLANA_FUNCTIONS request failed: undefined 502 Bad Gateway AdapterError',
    })
  })

  it('propagates the source adapter status code when the body has no data', async () => {
    mockRequest.mockResolvedValue({
      response: { data: { statusCode: 504 }, status: 200, statusText: 'OK' },
    })

    await expect(getMultiplier(adapter, url, params, requester)).rejects.toMatchObject({
      statusCode: 504,
      message: expect.stringContaining('EA SOLANA_FUNCTIONS request failed: {"statusCode":504}'),
    })
  })

  it('falls back to 500 when the body has neither data nor a status code', async () => {
    mockRequest.mockResolvedValue({ response: { data: { data: null } } })

    await expect(getMultiplier(adapter, url, params, requester)).rejects.toMatchObject({
      statusCode: 500,
      message: expect.stringContaining('EA SOLANA_FUNCTIONS request failed: {"data":null}'),
    })
  })

  it('rethrows an AdapterError from the requester with its errorResponse appended', async () => {
    const error = new AdapterDataProviderError(
      {
        statusCode: 502,
        message: 'Request failed with status code 504',
        errorResponse: { error: 'upstream unavailable' },
      },
      {
        providerDataRequestedUnixMs: 0,
        providerDataReceivedUnixMs: 0,
        providerIndicatedTimeUnixMs: undefined,
      },
    )
    mockRequest.mockRejectedValue(error)

    const thrown = await getMultiplier(adapter, url, params, requester).catch((e) => e)

    expect(thrown).toBe(error)
    expect(thrown).toMatchObject({
      statusCode: 502,
      message: 'Request failed with status code 504 {"error":"upstream unavailable"}',
    })
  })

  it('rethrows an AdapterError without errorResponse with its name appended', async () => {
    mockRequest.mockRejectedValue(new AdapterError({ statusCode: 504, message: 'timed out' }))

    await expect(getMultiplier(adapter, url, params, requester)).rejects.toMatchObject({
      statusCode: 504,
      message: 'timed out AdapterError',
    })
  })

  it('rethrows non-adapter errors unchanged', async () => {
    const error = new Error('socket hang up')
    mockRequest.mockRejectedValue(error)

    const thrown = await getMultiplier(adapter, url, params, requester).catch((e) => e)

    expect(thrown).toBe(error)
    expect(thrown.message).toBe('socket hang up')
  })

  it('rejects before calling the requester when params is not valid JSON', async () => {
    await expect(getMultiplier(adapter, url, '{not json', requester)).rejects.toThrow(SyntaxError)

    expect(mockRequest).not.toHaveBeenCalled()
  })
})
