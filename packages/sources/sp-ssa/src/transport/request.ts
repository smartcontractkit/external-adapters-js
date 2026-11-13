import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import {
  ResponseGenerics,
  ResponseTimestamps,
  TimestampedProviderResult,
} from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterConnectionError,
  AdapterDataProviderError,
  AdapterError,
  AdapterRateLimitError,
} from '@chainlink/external-adapter-framework/validation/error'
import {
  InputParametersDefinition,
  TypeFromDefinition,
} from '@chainlink/external-adapter-framework/validation/input-params'
import { AuthManager } from './auth'

export class SsaAuthError extends AdapterError {
  timestamps?: ResponseTimestamps

  constructor(error: unknown) {
    super({
      statusCode: 502,
      name: 'SsaAuthError',
      message:
        error instanceof Error ? error.message : 'Unable to authenticate with the data provider',
      cause: error,
      providerStatusCode: error instanceof AdapterError ? error.providerStatusCode : undefined,
    })
    const timestamps = (error as { timestamps?: ResponseTimestamps })?.timestamps
    if (timestamps) {
      this.timestamps = timestamps
    }
  }
}

export class SsaProviderDataError extends AdapterError {
  timestamps: ResponseTimestamps

  constructor(message: string, timestamps: ResponseTimestamps) {
    super({ statusCode: 502, message })
    this.timestamps = timestamps
  }
}

export interface ProviderResponse {
  response: { status: number; data: unknown }
  timestamps: {
    providerDataRequestedUnixMs: number
    providerDataReceivedUnixMs: number
  }
}

const AUTH_FAILURE_STATUS_CODES = new Set([401, 403])

const isUnauthorized = (error: unknown): boolean =>
  error instanceof AdapterDataProviderError &&
  AUTH_FAILURE_STATUS_CODES.has(error.providerStatusCode ?? 0)

export const isCredentialFailure = (error: unknown): boolean =>
  error instanceof SsaAuthError &&
  (error.providerStatusCode === undefined ||
    AUTH_FAILURE_STATUS_CODES.has(error.providerStatusCode))

const emptyTimestamps = (): ResponseTimestamps => ({
  providerDataRequestedUnixMs: 0,
  providerDataReceivedUnixMs: 0,
  providerIndicatedTimeUnixMs: undefined,
})

const requestScores = (
  requester: Requester,
  settings: { API_ENDPOINT: string; API_KEY: string; ORIGIN?: string },
  token: string,
  requestKey: string,
): Promise<ProviderResponse> =>
  requester.request<unknown>(requestKey, {
    method: 'GET',
    baseURL: settings.API_ENDPOINT,
    url: '/api/v1/ssa/getAllScores',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      apikey: settings.API_KEY,
      ...(settings.ORIGIN ? { Origin: settings.ORIGIN } : {}),
    },
  })

const mintToken = async (authManager: AuthManager): Promise<string> => {
  try {
    return await authManager.getToken()
  } catch (error) {
    if (error instanceof AdapterRateLimitError) {
      throw error
    }
    throw new SsaAuthError(error)
  }
}

export async function fetchScoresWithReauth(
  requester: Requester,
  settings: { API_ENDPOINT: string; API_KEY: string },
  authManager: AuthManager,
  requestKey: string,
): Promise<ProviderResponse> {
  const firstToken = await mintToken(authManager)
  try {
    return await requestScores(requester, settings, firstToken, requestKey)
  } catch (error) {
    if (!isUnauthorized(error)) {
      throw error
    }
  }

  authManager.invalidate()
  const freshToken = await mintToken(authManager)
  try {
    return await requestScores(requester, settings, freshToken, requestKey)
  } catch (error) {
    if (isUnauthorized(error)) {
      throw new SsaAuthError(error)
    }
    throw error
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof AdapterDataProviderError) {
    return `The data provider request failed with status ${error.providerStatusCode ?? 'unknown'}`
  }
  if (error instanceof AdapterError) {
    return error.message
  }
  return error instanceof Error ? error.message : 'Unknown error occurred'
}

export function errorTimestamps(error: unknown): ResponseTimestamps {
  if (error instanceof AdapterDataProviderError || error instanceof AdapterConnectionError) {
    return error.timestamps
  }
  if (error instanceof SsaAuthError && error.timestamps) {
    return error.timestamps
  }
  if (error instanceof SsaProviderDataError) {
    return error.timestamps
  }
  return emptyTimestamps()
}

export const errorStatusCode = (error: unknown): number =>
  error instanceof AdapterError ? error.statusCode : 502

export async function writeCooldownErrors<
  T extends { Parameters: InputParametersDefinition; Response: ResponseGenerics },
>(
  responseCache: ResponseCache<T>,
  transportName: string,
  entries: TypeFromDefinition<T['Parameters']>[],
): Promise<boolean> {
  const results = await Promise.all(
    entries.map(async (entry): Promise<TimestampedProviderResult<T> | undefined> => {
      const key = responseCache.getCacheKey(transportName, entry)
      const cached = await responseCache.get(key)
      if (cached) {
        return undefined
      }
      return {
        params: entry,
        response: {
          statusCode: 502,
          errorMessage: 'The data provider is in an authentication cooldown',
          timestamps: emptyTimestamps(),
        },
      }
    }),
  )
  const uncached = results.filter(
    (result): result is TimestampedProviderResult<T> => result !== undefined,
  )
  if (uncached.length === 0) {
    return false
  }
  await responseCache.write(transportName, uncached)
  return true
}
