import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterDataProviderError } from '@chainlink/external-adapter-framework/validation/error'
import { getDataEngineResult, PriceField } from '../../../src/lib/dataEngine'

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
    const report: Partial<typeof data> = { ...data }
    delete report.lastTradedPrice
    mockRequest.mockResolvedValue({ response: { data: { data: report } } })

    await expect(getDataEngineResult(param)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining("resultPath 'lastTradedPrice' not found in data"),
    })
  })

  it('throws 400 for an inherited property name', async () => {
    mockRequest.mockResolvedValue({ response: { data: { data } } })

    await expect(
      getDataEngineResult({ ...param, resultPath: 'constructor' as PriceField }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining("resultPath 'constructor' not found in data"),
    })
  })

  it('propagates the data-engine status code', async () => {
    mockRequest.mockResolvedValue({ response: { data: { statusCode: 504 } } })

    await expect(getDataEngineResult(param)).rejects.toMatchObject({ statusCode: 504 })
  })

  it('propagates a failed request', async () => {
    mockRequest.mockRejectedValue(
      new AdapterDataProviderError(
        { statusCode: 502, message: 'Request failed with status code 504' },
        {
          providerDataRequestedUnixMs: 0,
          providerDataReceivedUnixMs: 0,
          providerIndicatedTimeUnixMs: undefined,
        },
      ),
    )

    await expect(getDataEngineResult(param)).rejects.toMatchObject({
      statusCode: 502,
      message: expect.stringContaining('Request failed with status code 504'),
    })
  })

  // The 24/7 staleness gate: a stalled 24/7 stream must not
  // keep serving its last report once DS_VALID_MAX_AGE_SECONDS is set.
  describe('staleness check (maxAgeSeconds)', () => {
    const freshData = () => ({
      ...data,
      lastSeenTimestampNs: (BigInt(Date.now()) * 10n ** 6n).toString(),
    })

    it('passes a fresh report through when maxAgeSeconds is set', async () => {
      mockRequest.mockResolvedValue({ response: { data: { data: freshData() } } })

      await expect(getDataEngineResult({ ...param, maxAgeSeconds: 60 })).resolves.toMatchObject({
        result: '32398429239',
      })
    })

    it('rejects with 503 a report older than maxAgeSeconds', async () => {
      const stale = {
        ...freshData(),
        lastSeenTimestampNs: (BigInt(Date.now() - 120_000) * 10n ** 6n).toString(),
      }
      mockRequest.mockResolvedValue({ response: { data: { data: stale } } })

      await expect(getDataEngineResult({ ...param, maxAgeSeconds: 60 })).rejects.toMatchObject({
        statusCode: 503,
        message: expect.stringMatching(/^Market data is stale: 0x000b STALE\(age=\d+s>60s\)$/),
      })
    })

    it('does not check age when maxAgeSeconds is unset', async () => {
      mockRequest.mockResolvedValue({ response: { data: { data } } })

      await expect(getDataEngineResult(param)).resolves.toMatchObject({
        result: '32398429239',
      })
    })
  })
})
