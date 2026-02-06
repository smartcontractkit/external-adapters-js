import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { createHash } from 'crypto'
import { BaseEndpointTypes } from '../endpoint/insurance-proof'

export interface ResponseSchema {
  daysRemaining: number
  hash: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

const TWO_POW_191 = BigInt(2) ** BigInt(191)

export function hashToAum(hash: string): string {
  const sha256Hash = createHash('sha256').update(hash).digest('hex')
  const hashBigInt = BigInt('0x' + sha256Hash)
  const aum = hashBigInt % TWO_POW_191
  return aum.toString()
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, settings) => {
    return {
      params: params,
      request: {
        baseURL: settings.API_ENDPOINT,
        url: '/',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${settings.TRIZE_API_TOKEN}`,
        },
      },
    }
  },
  parseResponse: (params, response) => {
    if (!response.data) {
      return [
        {
          params: params[0],
          response: {
            errorMessage: 'The data provider did not return any value',
            statusCode: 502,
          },
        },
      ]
    }

    const daysRemaining = response.data.daysRemaining
    const aum = hashToAum(response.data.hash)
    const result = daysRemaining

    return [
      {
        params: params[0],
        response: {
          result,
          data: {
            result,
            daysRemaining,
            aum,
          },
        },
      },
    ]
  },
})
