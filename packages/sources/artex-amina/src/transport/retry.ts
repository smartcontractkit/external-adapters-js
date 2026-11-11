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

export const DEFAULT_RETRY: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 2_000,
  maxDelayMs: 40_000,
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof AdapterConnectionError || error instanceof AdapterRateLimitError) {
    return true
  }
  if (!(error instanceof AdapterDataProviderError)) {
    return false
  }
  const status = error.providerStatusCode
  return status === 429 || (status !== undefined && status >= 500 && status <= 599)
}

export function retryDelay(attempt: number, options: RetryOptions): number {
  return Math.min(options.baseDelayMs * 2 ** attempt, options.maxDelayMs)
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt >= options.maxAttempts - 1 || !isRetryableError(error)) {
        throw error
      }
      await sleep(retryDelay(attempt, options))
    }
  }
}
