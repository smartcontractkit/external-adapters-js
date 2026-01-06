import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/attester-supply'
import { calculateAttesterSupply } from '../lib'
import { AttesterResponse } from '../types'

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: AttesterResponse
  }
}

export const transport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) =>
    params.map((param) => ({
      params: [param],
      request: {
        baseURL: config.ATTESTER_API_URL,
        url: '/app/get-total-cbtc-supply',
        method: 'GET',
      },
    })),
  parseResponse: (params, res) =>
    params.map((param) => {
      try {
        const result = calculateAttesterSupply(res.data)
        return {
          params: param,
          response: {
            result,
            data: { result },
          },
        }
      } catch (error) {
        return {
          params: param,
          response: {
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            statusCode: 502,
          },
        }
      }
    }),
})
