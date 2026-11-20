import { sleep } from '@chainlink/external-adapter-framework/util'
import {
  AdapterConnectionError,
  AdapterDataProviderError,
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

function isRetryableStatus(status: number | undefined): boolean {
  return status === 429 || (status !== undefined && status >= 500 && status <= 599)
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof AdapterConnectionError) {
    return true
  }
  return error instanceof AdapterDataProviderError && isRetryableStatus(error.providerStatusCode)
}

export function retryDelay(attempt: number, options: RetryOptions): number {
  return Math.min(options.baseDelayMs * 2 ** attempt, options.maxDelayMs)
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
  attempt = 0,
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (attempt >= options.maxAttempts - 1 || !isRetryableError(error)) {
      throw error
    }
    await sleep(retryDelay(attempt, options))
    return withRetry(fn, options, attempt + 1)
  }
}
