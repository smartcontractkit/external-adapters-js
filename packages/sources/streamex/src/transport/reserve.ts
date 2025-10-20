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
          url: '/gldy-status',
          headers: {
            'x-api-key': config.STREAMEX_API_KEY,
            'Content-Type': 'application/json',
          },
        },
      }
    })
  },
  parseResponse: (params, response) => {
    return params.map((param) => {
      const ripcord =
        response.data.ripcord || response.data.ripcord.toString().toLowerCase() === 'true'
      const ripcordAsInt = ripcord ? 1 : 0

      // If ripcord is true, return 502 error
      if (ripcord) {
        const ripcordDetails = response.data.ripcordDetails.join(', ')
        const message = `Ripcord indicator true. Details: ${ripcordDetails}`

        return {
          params: param,
          response: {
            errorMessage: message,
            ripcord,
            ripcordAsInt,
            ripcordDetails,
            statusCode: 502,
            timestamps: {
              providerIndicatedTimeUnixMs: new Date(response.data.timestamp).getTime(),
            },
          },
        }
      }

      const totalReserve = Number(response.data.totalReserve)

      return {
        params: param,
        response: {
          result: totalReserve,
          data: {
            result: totalReserve,
            ripcord,
            ripcordAsInt,
            totalReserve,
          },
          timestamps: {
            providerIndicatedTimeUnixMs: new Date(response.data.timestamp).getTime(),
          },
        },
      }
    })
  },
})
