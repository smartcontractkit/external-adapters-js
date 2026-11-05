import { sleep } from '@chainlink/external-adapter-framework/util'
import {
  AdapterConnectionError,
  AdapterDataProviderError,
  AdapterRateLimitError,
} from '@chainlink/external-adapter-framework/validation/error'

export interface RetryOptions {
  maxAttempts: number
  baseDelayMs: number
  maxDelayMs: number
}

export function providerStatus(error: unknown): number | undefined {
  return error instanceof AdapterDataProviderError ? error.providerStatusCode : undefined
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof AdapterConnectionError) {
    return true
  }
  if (error instanceof AdapterRateLimitError) {
    return true
  }
  if (error instanceof AdapterDataProviderError) {
    const status = error.providerStatusCode
    return status === 429 || (status !== undefined && status >= 500 && status <= 599)
  }
  return false
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < options.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt === options.maxAttempts - 1 || !isRetryableError(error)) {
        throw error
      }
      const delay = Math.min(options.baseDelayMs * 2 ** attempt, options.maxDelayMs)
      await sleep(delay)
    }
  }
  throw lastError
}
