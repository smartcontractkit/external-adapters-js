import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/stbt'

export interface ResponseSchema {
  accountName: string
  totalReserve: number
  totalToken: number
  timestamp: string
  ripcord: boolean
  ripcordDetails: string[]
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
      params: params,
      request: {
        baseURL: config.API_ENDPOINT,
        url: '/STBT',
      },
    }
  },
  parseResponse: (params, response) => {
    // Return error if ripcord indicator true
    if (response.data.ripcord) {
      const message = `Ripcord indicator true. Details: ${response.data.ripcordDetails.join(', ')}`
      return [
        {
          params: params[0],
          response: {
            errorMessage: message,
            statusCode: 502,
          },
        },
      ]
    }

    const result = response.data.totalReserve
    return [
      {
        params: params[0],
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
