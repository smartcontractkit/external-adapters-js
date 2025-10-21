// This file contains helper methods that other EA can use directly to call this EA
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

import { BaseEndpointTypes as CryptoV3Types } from './endpoint/cryptoV3'
import { BaseEndpointTypes as RwaV8Types } from './endpoint/rwaV8'

export const getCryptoPrice = async (feedId: string, url: string, requester: Requester) =>
  (await callEA<CryptoV3Types['Response']>(feedId, 'crypto-v3', url, requester)).Data

export const getRwaPrice = async (feedId: string, url: string, requester: Requester) =>
  (await callEA<RwaV8Types['Response']>(feedId, 'rwa-v8', url, requester)).Data

const callEA = async <T>(feedId: string, endpoint: string, url: string, requester: Requester) => {
  const requestConfig = {
    baseURL: url,
    method: 'POST',
    data: {
      data: {
        endpoint,
        feedId,
      },
    },
  }

  try {
    const response = await requester.request<T>(JSON.stringify(requestConfig), requestConfig)

    const data = response?.response?.data
    if (!data || !(data as any).Data) {
      throw new AdapterError({
        statusCode: (data as any)?.statusCode || 500,
        message: `EA request failed: ${JSON.stringify(response?.response)}`,
      })
    }

    return data
  } catch (e) {
    if (e instanceof AdapterError) {
      e.message = `${e.message} ${JSON.stringify(e?.errorResponse) || e.name}`
    }
    throw e
  }
}
