import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/mco2'

export interface ResponseSchema {
  totalMCO2: number
  totalCarbonCredits: number
  timestamp: string
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
          url: 'MCO2',
        },
      }
    })
  },
  parseResponse: (params, response) => {
    return params.map((param) => {
      const result = response.data.totalMCO2
      return {
        params: param,
        response: {
          result,
          data: {
            result,
          },
        },
      }
    })
  },
})
