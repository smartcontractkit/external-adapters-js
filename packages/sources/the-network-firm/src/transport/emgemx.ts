import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/emgemx'

export interface ResponseSchema {
  totalReserve: string
  totalToken: string
  ripcord: boolean
  ripcordDetails: string[]
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
    return {
      params,
      request: {
        baseURL: config.V2_API_ENDPOINT,
        url: '/emgemx-tdfkf3',
        headers: {
          apikey: config.EMGEMX_API_KEY,
        },
      },
    }
  },
  parseResponse: (params, response) => {
    return params.map((param) => {
      const timestamps = {
        providerIndicatedTimeUnixMs: new Date(response.data.timestamp).getTime(),
      }

      // Return error if ripcord == true
      if (response.data.ripcord) {
        const message = `Ripcord indicator true. Details: ${response.data.ripcordDetails.join(
          ', ',
        )}`
        return {
          params: param,
          response: {
            errorMessage: message,
            ripcord: response.data.ripcord,
            ripcordDetails: response.data.ripcordDetails.join(', '),
            statusCode: 502,
            timestamps,
          },
        }
      }

      const reserve = response.data.totalReserve
      if (reserve == null || isNaN(Number(reserve))) {
        return {
          params: param,
          response: {
            errorMessage: 'Response is missing valid totalReserve field',
            statusCode: 502,
            timestamps,
          },
        }
      }

      const result = Number(reserve)
      return {
        params: param,
        response: {
          result,
          data: {
            result,
            ripcord: response.data.ripcord,
          },
          timestamps,
        },
      }
    })
  },
})
