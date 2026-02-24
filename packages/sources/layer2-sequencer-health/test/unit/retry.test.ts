import { retry } from '../../src/network'

describe('retry', () => {
  const retryConfig = {
    numRetries: 3,
    retryInterval: 10,
  }

  it('returns result on first successful attempt', async () => {
    const promise = jest.fn().mockResolvedValue('success')

    const result = await retry({
      promise,
      retryConfig,
    })

    expect(result).toBe('success')
    expect(promise).toHaveBeenCalledTimes(1)
  })

  it('retries and returns result on eventual success', async () => {
    const promise = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'))
      .mockResolvedValue('success')

    const result = await retry({
      promise,
      retryConfig,
    })

    expect(result).toBe('success')
    expect(promise).toHaveBeenCalledTimes(3)
  })

  it('throws last error after all retries exhausted', async () => {
    const promise = jest.fn().mockRejectedValue(new Error('always fails'))

    await expect(
      retry({
        promise,
        retryConfig,
      }),
    ).rejects.toThrow('always fails')

    expect(promise).toHaveBeenCalledTimes(3)
  })

  it('throws the last error not the first', async () => {
    const promise = jest
      .fn()
      .mockRejectedValueOnce(new Error('first error'))
      .mockRejectedValueOnce(new Error('second error'))
      .mockRejectedValue(new Error('last error'))

    await expect(
      retry({
        promise,
        retryConfig,
      }),
    ).rejects.toThrow('last error')
  })

  it('respects numRetries configuration', async () => {
    const promise = jest.fn().mockRejectedValue(new Error('always fails'))

    await expect(
      retry({
        promise,
        retryConfig: { numRetries: 5, retryInterval: 1 },
      }),
    ).rejects.toThrow()

    expect(promise).toHaveBeenCalledTimes(5)
  })

  it('handles numRetries of 1', async () => {
    const promise = jest.fn().mockRejectedValue(new Error('fail'))

    await expect(
      retry({
        promise,
        retryConfig: { numRetries: 1, retryInterval: 1 },
      }),
    ).rejects.toThrow()

    expect(promise).toHaveBeenCalledTimes(1)
  })
})
