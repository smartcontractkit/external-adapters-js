import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/proof-of-insurance'

export interface ResponseSchema {
  currentExposure: number
  timestamp: string
  daysRemaining: number
  signature: string
  insuredAllocationLimit: number
  masterCoverageLimit: number
  maturityTimestamp: number
  policyHash: string
  instrumentSourceParty: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
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

    if (response.data?.error) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: response.data.error,
            statusCode: 502,
          },
        }
      })
    }

    // TODO: We may delete navDate and aum
    const navDate = response.data.daysRemaining
    const aum = computeAumFromSignature(response.data.signature)
    const signature = response.data.signature
    const timestampMs = new Date(response.data.timestamp).getTime()
    const maturityTimestamp = response.data.maturityTimestamp
    const policyHash = response.data.policyHash

    return params.map((param) => {
      return {
        params: param,
        response: {
          result: navDate,
          data: {
            // navDate,
            // aum,
            insuredAllocationLimit: response.data.insuredAllocationLimit,
            masterCoverageLimit: response.data.masterCoverageLimit,
            dealCurrentExposure: response.data.currentExposure,
            timestamp: timestampMs,
            // This cannott be a string
            // signature,
            maturityTimestamp,

            // This could be converted to a number or hash?
            // policyHash,

            // This needs to be a number
            // instrumentId: param.instrument_id,

            // This needs to be a number
            // instrumentSourceParty: response.data.instrumentSourceParty,
          },
        },
      }
    })
  },
})
