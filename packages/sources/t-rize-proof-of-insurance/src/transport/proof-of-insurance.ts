import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { createHash } from 'crypto'
import { BaseEndpointTypes } from '../endpoint/proof-of-insurance'

export interface ResponseSchema {
  insuredAmount: number
  currentExposure: number
  timestamp: string
  daysRemaining: number
  signature: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

const TWO_POW_191 = BigInt(2) ** BigInt(191)

export function computeAumFromSignature(signature: string): string {
  const hash = createHash('sha256').update(signature).digest('hex')
  const hashBigInt = BigInt('0x' + hash)
  const aum = hashBigInt % TWO_POW_191
  return aum.toString()
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: `/v1/chainlink/${encodeURIComponent(param.deal_name)}/${encodeURIComponent(
            param.instrument_id,
          )}`,
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${config.TRIZE_API_TOKEN}`,
          },
        },
      }
    })
  },
  parseResponse: (params, response) => {
    if (!response.data) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any value for deal_name=${param.deal_name}, instrument_id=${param.instrument_id}`,
            statusCode: 502,
          },
        }
      })
    }

    const navDate = response.data.daysRemaining
    const aum = computeAumFromSignature(response.data.signature)

    return params.map((param) => {
      return {
        params: param,
        response: {
          result: navDate,
          data: {
            navDate,
            aum,
          },
        },
      }
    })
  },
})
