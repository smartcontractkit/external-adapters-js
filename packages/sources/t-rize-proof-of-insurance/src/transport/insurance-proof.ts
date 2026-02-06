import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { createHash } from 'crypto'
import { BaseEndpointTypes, inputParameters } from '../endpoint/insurance-proof'

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

export type RequestParams = typeof inputParameters.validated

export const TWO_POW_191 = BigInt(2) ** BigInt(191)

export function hashToAum(hash: string): string {
  const sha256Hash = createHash('sha256').update(hash).digest('hex')
  const hashBigInt = BigInt('0x' + sha256Hash)
  const aum = hashBigInt % TWO_POW_191
  return aum.toString()
}

export const prepareRequests = (
  params: RequestParams[],
  settings: HttpTransportTypes['Settings'],
) => {
  return params.map((param) => {
    return {
      params: [param],
      request: {
        baseURL: settings.API_ENDPOINT,
        url: '/',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${settings.TRIZE_API_TOKEN}`,
        },
      },
    }
  })
}

export const parseResponse = (
  params: RequestParams[],
  response: { data: ResponseSchema | null | undefined },
) => {
  if (!response.data) {
    return params.map((param) => {
      return {
        params: param,
        response: {
          errorMessage: 'The data provider did not return any value',
          statusCode: 502,
        },
      }
    })
  }

  const daysRemaining = response.data.daysRemaining
  const aum = hashToAum(response.data.hash)

  return params.map((param) => {
    return {
      params: param,
      response: {
        result: null,
        data: {
          daysRemaining,
          aum,
        },
      },
    }
  })
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests,
  parseResponse,
})
