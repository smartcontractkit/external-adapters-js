import {
  AdapterConnectionError,
  AdapterDataProviderError,
} from '@chainlink/external-adapter-framework/validation/error'
import { isRetryableError, withRetry } from '../../src/transport/retry'

const timestamps = {
  providerDataRequestedUnixMs: 1,
  providerDataReceivedUnixMs: 2,
  providerIndicatedTimeUnixMs: undefined,
}

function providerError(status: number): AdapterDataProviderError {
  return new AdapterDataProviderError(
    { statusCode: 502, providerStatusCode: status, message: `status ${status}` },
    timestamps,
  )
}

function connectionError(): AdapterConnectionError {
  return new AdapterConnectionError({ statusCode: 502, message: 'connection failed' }, timestamps)
}

describe('AMINA retry', () => {
  it('retries a 500 and returns the successful result', async () => {
    const fn = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(providerError(500))
      .mockRejectedValueOnce(providerError(503))
      .mockResolvedValueOnce('ok')

    await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 0, maxDelayMs: 0 })).resolves.toBe(
      'ok',
    )
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('does not retry a 403', async () => {
    const fn = jest.fn<Promise<string>, []>().mockRejectedValueOnce(providerError(403))

    await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 0, maxDelayMs: 0 })).rejects.toThrow(
      'status 403',
    )
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries connection errors and stops at the attempt limit', async () => {
    const fn = jest.fn<Promise<string>, []>().mockRejectedValue(connectionError())

    await expect(withRetry(fn, { maxAttempts: 2, baseDelayMs: 0, maxDelayMs: 0 })).rejects.toThrow(
      'connection failed',
    )
    expect(fn).toHaveBeenCalledTimes(2)
    expect(isRetryableError(connectionError())).toBe(true)
    expect(isRetryableError(providerError(429))).toBe(true)
    expect(isRetryableError(providerError(403))).toBe(false)
  })
})
