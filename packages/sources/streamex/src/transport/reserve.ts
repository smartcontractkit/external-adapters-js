import {
  HttpTransport,
  HttpTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
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

const transportConfig: HttpTransportConfig<HttpTransportTypes> = {
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: '/gldy-status',
          headers: {
            'x-api-key': config.API_KEY,
            'Content-Type': 'application/json',
          },
        },
      }
    })
  },
  parseResponse: (params, response) => {
    return params.map((param) => {
      const ripcord = response.data.ripcord

      // If ripcord is true, return 502 error
      if (ripcord) {
        const ripcordDetails = response.data.ripcordDetails.join(', ')
        const errorMessage = `Ripcord indicator true. Details: ${ripcordDetails}`

        return {
          params: param,
          response: {
            errorMessage,
            ripcord,
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
            totalReserve,
          },
          timestamps: {
            providerIndicatedTimeUnixMs: new Date(response.data.timestamp).getTime(),
          },
        },
      }
    })
  },
}

// Exported for testing
export class ReserveTransport extends HttpTransport<HttpTransportTypes> {
  constructor() {
    super(transportConfig)
  }
}

export const httpTransport = new ReserveTransport()
