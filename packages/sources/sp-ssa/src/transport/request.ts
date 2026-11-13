import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import {
  ResponseGenerics,
  ResponseTimestamps,
  TimestampedProviderResult,
} from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  InputParametersDefinition,
  TypeFromDefinition,
} from '@chainlink/external-adapter-framework/validation/input-params'
import {
  AdapterConnectionError,
  AdapterDataProviderError,
  AdapterError,
} from '@chainlink/external-adapter-framework/validation/error'
import { AuthManager } from './auth'

export class SsaAuthError extends AdapterError {
  constructor(error: unknown) {
    const adapterError = error as AdapterError
    super({
      statusCode: 502,
      name: 'SsaAuthError',
      message:
        error instanceof Error ? error.message : 'Unable to authenticate with the data provider',
      cause: error,
      providerStatusCode: adapterError?.providerStatusCode,
    })
  }
}

export interface ProviderResponse {
  response: { status: number; data: unknown }
  timestamps: {
    providerDataRequestedUnixMs: number
    providerDataReceivedUnixMs: number
  }
}

export async function fetchScoresWithReauth(
  requester: Requester,
  settings: { API_ENDPOINT: string; API_KEY: string },
  authManager: AuthManager,
  requestKey: string,
): Promise<ProviderResponse> {
  const request = (token: string) =>
    requester.request<unknown>(requestKey, {
      method: 'GET',
      baseURL: settings.API_ENDPOINT,
      url: '/api/v1/ssa/getAllScores',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: settings.API_KEY,
      },
    })

  let token: string
  try {
    token = await authManager.getToken()
  } catch (e) {
    throw new SsaAuthError(e)
  }

  try {
    return await request(token)
  } catch (e) {
    if (!(e instanceof AdapterDataProviderError) || e.providerStatusCode !== 401) {
      throw e
    }
    authManager.invalidate()
    let freshToken: string
    try {
      freshToken = await authManager.getToken()
    } catch (e2) {
      throw new SsaAuthError(e2)
    }
    try {
      return await request(freshToken)
    } catch (e2) {
      if (e2 instanceof AdapterDataProviderError && e2.providerStatusCode === 401) {
        throw new SsaAuthError(e2)
      }
      throw e2
    }
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
  return {
    providerDataRequestedUnixMs: 0,
    providerDataReceivedUnixMs: 0,
    providerIndicatedTimeUnixMs: undefined,
  }
}

export async function writeCooldownErrors<
  T extends { Parameters: InputParametersDefinition; Response: ResponseGenerics },
>(
  responseCache: ResponseCache<T>,
  transportName: string,
  entries: TypeFromDefinition<T['Parameters']>[],
): Promise<boolean> {
  const results: TimestampedProviderResult<T>[] = []
  for (const entry of entries) {
    const key = responseCache.getCacheKey(transportName, entry)
    const cached = await responseCache.get(key)
    if (!cached) {
      results.push({
        params: entry,
        response: {
          statusCode: 502,
          errorMessage: 'The data provider is in an authentication cooldown',
          timestamps: {
            providerDataRequestedUnixMs: 0,
            providerDataReceivedUnixMs: 0,
            providerIndicatedTimeUnixMs: undefined,
          },
        },
      })
    }
  }
  if (results.length === 0) {
    return false
  }
  await responseCache.write(transportName, results)
  return true
}
