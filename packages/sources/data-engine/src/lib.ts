// This file contains helper methods that other EA can use directly to call this EA
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

import { BaseEndpointTypes as CryptoV3Types } from './endpoint/cryptoV3'
import { BaseEndpointTypes as DeutscheBoerseV11Types } from './endpoint/deutscheBoerseV11'
import { BaseEndpointTypes as ExchangeRateV7Types } from './endpoint/exchangeRateV7'
import { BaseEndpointTypes as RwaV8Types } from './endpoint/rwaV8'

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
