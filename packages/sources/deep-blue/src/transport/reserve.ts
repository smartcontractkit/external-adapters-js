import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/reserve'

export interface ResponseSchema {
  accountName: string
  totalReserve: number
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
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: '/feed',
          headers: {
            'x-api-key': config.API_KEY,
          },
          params: {},
        },
      }
    })
  },
  parseResponse: (params, response) => {
    const timestamps = {
      providerIndicatedTimeUnixMs: new Date(response.data.timestamp).getTime(),
    }

    if (response.data.ripcord) {
      const message = `Ripcord indicator true. Details: ${JSON.stringify(
        response.data.ripcordDetails,
      )}`
      return [
        {
          params: params[0],
          response: {
            errorMessage: message,
            ripcord: response.data.ripcord,
            ripcordDetails: JSON.stringify(response.data.ripcordDetails),
            statusCode: 502,
            timestamps: timestamps,
          },
        },
      ]
    }

    const result = response.data.totalReserve

    if (typeof result === 'undefined') {
      return [
        {
          params: params[0],
          response: {
            errorMessage: 'Response missing totalReserve',
            statusCode: 502,
            timestamps: timestamps,
          },
        },
      ]
    }

    return [
      {
        params: params[0],
        response: {
          result,
          data: {
            result,
            ripcord: response.data.ripcord,
          },
          timestamps: timestamps,
        },
      },
    ]
  },
})
