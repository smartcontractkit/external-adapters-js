import { sleep } from '@chainlink/external-adapter-framework/util'
import {
  AdapterConnectionError,
  AdapterDataProviderError,
  AdapterError,
  AdapterRateLimitError,
} from '@chainlink/external-adapter-framework/validation/error'

export interface AminaErrorResponse {
  title?: string
  detail?: string
  instance?: string
  status?: number
  type?: string
}

export interface RetryOptions {
  maxAttempts: number
  baseDelayMs: number
  maxDelayMs: number
}

export const AMINA_API_PATH = '/api/b2c/v1'
export const USER_AGENT = 'chainlink-artex-amina-adapter/1.0.0'

export const DEFAULT_RETRY: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 2_000,
  maxDelayMs: 40_000,
}

export function trimEndpoint(apiEndpoint: string): string {
  return apiEndpoint.replace(/\/+$/, '')
}

export function authUrl(apiEndpoint: string): string {
  return `${trimEndpoint(apiEndpoint)}${AMINA_API_PATH}/auth`
}

export function positionsPath(portfolioNo: number): string {
  return `${AMINA_API_PATH}/securities/portfolios/${portfolioNo}/positions`
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

const MAX_ERROR_FIELD_LENGTH = 200
const SECRET_PATTERN = /\b(?:authorization|bearer|amina-signature|password|secret|token|hmac)\b/i

function safeField(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length === 0 || SECRET_PATTERN.test(value)) {
    return undefined
  }
  return value.length > MAX_ERROR_FIELD_LENGTH
    ? `${value.slice(0, MAX_ERROR_FIELD_LENGTH)}...`
    : value
}

export function formatErrorBody(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null) {
    return undefined
  }
  const value = body as AminaErrorResponse
  const parts = [safeField(value.title), safeField(value.instance)].filter((part): part is string =>
    Boolean(part),
  )
  return parts.length > 0 ? parts.join(' | ') : undefined
}

export function mapAminaError(error: unknown): AdapterError {
  if (error instanceof AdapterDataProviderError) {
    const status = error.providerStatusCode
    const detail = formatErrorBody(error.errorResponse)
    return new AdapterError({
      statusCode: 502,
      providerStatusCode: status,
      message: `AMINA request failed${status ? ` (${status})` : ''}${detail ? `: ${detail}` : ''}`,
    })
  }
  if (error instanceof AdapterConnectionError) {
    return new AdapterError({
      statusCode: 502,
      message: 'AMINA connection failed',
    })
  }
  if (error instanceof AdapterError) {
    return error
  }
  return new AdapterError({
    statusCode: 502,
    message: 'AMINA request failed',
  })
}
