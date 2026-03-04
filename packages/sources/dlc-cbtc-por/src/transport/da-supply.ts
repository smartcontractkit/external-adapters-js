import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/da-supply'
import { calculateDaSupply } from '../lib/da-supply'
import { DaResponse } from '../types'

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: DaResponse
  }
}

export const transport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) =>
    params.map((param) => ({
      params: [param],
      request: {
        baseURL: config.CANTON_API_URL,
        method: 'GET',
      },
    })),
  parseResponse: (params, res) =>
    params.map((param) => {
      try {
        const result = calculateDaSupply(res.data.instruments)
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
