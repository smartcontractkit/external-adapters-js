import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/total_reserve'

export interface ResponseSchema {
  total_reserve: number
  errorMessage?: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return {
      params,
      request: {
        baseURL: config.API_ENDPOINT,
        url: '/',
        headers: {},
        params: {},
      },
    }
  },
  parseResponse: (_params, response) => {
    if (response.data.errorMessage) {
      return [
        {
          params: {},
          response: {
            errorMessage: `There was an error from the source API. ${response.data.errorMessage}`,
            statusCode: 502,
          },
        },
      ]
    }
    if (!response.data.total_reserve && response.data.total_reserve !== 0) {
      return [
        {
          params: {},
          response: {
            errorMessage: `The data provider didn't return any value for total_reserve`,
            statusCode: 502,
          },
        },
      ]
    }

    const result = response.data.total_reserve
    return [
      {
        params: {},
        response: {
          result,
          data: {
            result,
          },
        },
      },
    ]
  },
})
