// This file contains helper methods that other EA can use directly to call this EA
import { getReportVersion } from '@chainlink/data-streams-sdk'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

import { BaseEndpointTypes as CryptoV3Types } from './endpoint/cryptoV3'
import { BaseEndpointTypes as DeutscheBoerseV11Types } from './endpoint/deutscheBoerseV11'
import { BaseEndpointTypes as ExchangeRateV7Types } from './endpoint/exchangeRateV7'
import { BaseEndpointTypes as RwaV8Types } from './endpoint/rwaV8'

// Maps report version strings to their corresponding response data types
interface VersionTypeMap {
  V3: CryptoV3Types['Response']['Data']
  V7: ExchangeRateV7Types['Response']['Data']
  V8: RwaV8Types['Response']['Data']
  V11: DeutscheBoerseV11Types['Response']['Data']
}

type SupportedVersion = keyof VersionTypeMap

// Ensures exhaustiveness: every version in VersionTypeMap must have a corresponding endpoint
const versionEndpointMap = {
  V3: 'crypto-v3',
  V7: 'exchangeRate-v7',
  V8: 'rwa-v8',
  V11: 'deutscheBoerse-v11',
} as const satisfies Record<SupportedVersion, string>

// Discriminated union: callers can narrow on `version` to get the exact data type
export type FeedDataResult = {
  [V in SupportedVersion]: { version: V; data: VersionTypeMap[V] }
}[SupportedVersion]

/**
 * Generic function to fetch feed data from the data-engine EA.
 *
 * Returns a discriminated union with `version` and `data` fields.
 * Callers should narrow on `version` to access version-specific fields.
 */
export const getFeedData = async (
  feedId: string,
  url: string,
  requester: Requester,
  options?: {
    maxAgeInSeconds?: number
  },
): Promise<FeedDataResult> => {
  const version = getReportVersion(feedId)
  const endpoint = versionEndpointMap[version as SupportedVersion]
  if (!endpoint) {
    throw new AdapterError({
      statusCode: 400,
      message: `Unsupported report version '${version}' for feedId '${feedId}'`,
    })
  }
  const data = await callEA(feedId, endpoint, url, requester, options)
  return { version, data } as FeedDataResult
}

export const getCryptoPrice = async (
  feedId: string,
  url: string,
  requester: Requester,
  options?: {
    maxAgeInSeconds?: number
  },
) => callEA<CryptoV3Types['Response']['Data']>(feedId, 'crypto-v3', url, requester, options)

export const getRwaPrice = async (
  feedId: string,
  url: string,
  requester: Requester,
  options?: {
    maxAgeInSeconds?: number
  },
) => callEA<RwaV8Types['Response']['Data']>(feedId, 'rwa-v8', url, requester, options)

export const getDeutscheBoersePrice = async (
  feedId: string,
  url: string,
  requester: Requester,
  options?: {
    maxAgeInSeconds?: number
  },
) =>
  callEA<DeutscheBoerseV11Types['Response']['Data']>(
    feedId,
    'deutscheBoerse-v11',
    url,
    requester,
    options,
  )

export const getExchangeRate = async (
  feedId: string,
  url: string,
  requester: Requester,
  options?: {
    maxAgeInSeconds?: number
  },
) =>
  callEA<ExchangeRateV7Types['Response']['Data']>(
    feedId,
    'exchangeRate-v7',
    url,
    requester,
    options,
  )

const callEA = async <T>(
  feedId: string,
  endpoint: string,
  url: string,
  requester: Requester,
  options?: {
    maxAgeInSeconds?: number
  },
) => {
  const requestConfig = {
    baseURL: url,
    method: 'POST',
    data: {
      data: {
        endpoint,
        feedId,
        ...(options?.maxAgeInSeconds && {
          maxAgeInSeconds: options.maxAgeInSeconds,
        }),
      },
    },
  }

  try {
    const response = await requester.request(JSON.stringify(requestConfig), requestConfig)

    const data = response?.response?.data
    if (!data || !(data as any).data) {
      throw new AdapterError({
        statusCode: (data as any)?.statusCode || 500,
        message: `EA request failed: ${JSON.stringify(response?.response?.data)} ${
          response?.response?.status
        } ${response?.response?.statusText}`,
      })
    }
    return (data as any).data as T
  } catch (e) {
    if (e instanceof AdapterError) {
      e.message = `${e.message} ${JSON.stringify(e?.errorResponse) || e.name}`
    }
    throw e
  }
}
