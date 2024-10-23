import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/reserves'

export interface ResponseSchema {
  totalReserve: number
  lastUpdated: string
  cashReserve: number
  investedReserve: number
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

// returns reserves info for USDS
export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
        },
      }
    })
  },
  parseResponse: (params, response) => {
    const timestamps = {
      providerIndicatedTimeUnixMs: new Date(response.data.lastUpdated).getTime(),
    }

    if (!response.data) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any value`,
            statusCode: 502,
            timestamps,
          },
        }
      })
    }

    return params.map((param) => {
      const result = response.data.totalReserve
      return {
        params: param,
        response: {
          result,
          data: {
            result,
          },
          timestamps,
        },
      }
    })
  },
})
