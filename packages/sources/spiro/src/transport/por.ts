import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import type { BaseEndpointTypes } from '../endpoint/por' // FRAMEWORK-EXCEPTION: SPIRO-4
import { checkRipcord } from './utils' // FRAMEWORK-EXCEPTION: SPIRO-5

// FRAMEWORK-EXCEPTION-BEGIN: SPIRO-4
export interface ResponseSchema {
  accountName: string
  totalReserve: string
  totalToken: string
  updatedAt: string
  ripcord: boolean
  ripcordDetails: string[]
}
// FRAMEWORK-EXCEPTION-END: SPIRO-4

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const porTransport = new HttpTransport<HttpTransportTypes>({ // FRAMEWORK-EXCEPTION: SPIRO-4
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        // FRAMEWORK-EXCEPTION-BEGIN: SPIRO-4
        request: {
          baseURL: config.API_ENDPOINT,
          method: 'GET',
          url: `/api/chainlink/funds/${param.fundId}/reserves`,
          headers: {
            'x-api-key': config.API_KEY,
          },
        },
        // FRAMEWORK-EXCEPTION-END: SPIRO-4
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      const { fundId } = param // FRAMEWORK-EXCEPTION: SPIRO-4
      const { ripcord, ripcordAsInt, message } = checkRipcord(res.data, param.noErrorOnRipcord ?? false) // FRAMEWORK-EXCEPTION: SPIRO-5
      if (message) { // FRAMEWORK-EXCEPTION: SPIRO-5
        return {
          params: param,
          response: {
            errorMessage: message,
            statusCode: 502,
          },
        }
      }

      if (res.data.totalReserve == null) { // FRAMEWORK-EXCEPTION: SPIRO-4
        return {
          params: param,
          response: {
            errorMessage: `The data provider did not return any value for fundId: ${fundId}`, // FRAMEWORK-EXCEPTION: SPIRO-4
            statusCode: 502,
          },
        }
      }

      const result = Number(res.data.totalReserve) // FRAMEWORK-EXCEPTION: SPIRO-1

      return {
        params: param,
        response: {
          result,
          data: {
            result,
            totalReserves: result, // FRAMEWORK-EXCEPTION: SPIRO-4
            ripcord,
            ripcordAsInt,
          },
          timestamps: {
            providerIndicatedTimeUnixMs: Date.parse(res.data.updatedAt), // FRAMEWORK-EXCEPTION: SPIRO-3
          },
        },
      }
    })
  },
})
