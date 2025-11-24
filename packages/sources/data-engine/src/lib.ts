// This file contains helper methods that other EA can use directly to call this EA
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

import { BaseEndpointTypes as CryptoV3Types } from './endpoint/cryptoV3'
import { BaseEndpointTypes as DeutscheBoerseV11Types } from './endpoint/deutscheBoerseV11'
import { BaseEndpointTypes as RwaV8Types } from './endpoint/rwaV8'

export const getCryptoPrice = async (feedId: string, url: string, requester: Requester) =>
  callEA<CryptoV3Types['Response']['Data']>(feedId, 'crypto-v3', url, requester)

export const getRwaPrice = async (feedId: string, url: string, requester: Requester) =>
  callEA<RwaV8Types['Response']['Data']>(feedId, 'rwa-v8', url, requester)

export const getDeutscheBoersePrice = async (feedId: string, url: string, requester: Requester) =>
  callEA<DeutscheBoerseV11Types['Response']['Data']>(feedId, 'deutscheBoerse-v11', url, requester)

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
