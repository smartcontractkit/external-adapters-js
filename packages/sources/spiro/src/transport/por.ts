import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import type { BaseEndpointTypes } from '../endpoint/por'
import { checkRipcord, parseNumber, parseTimestampMs, ProviderDataError } from './utils'

export interface ResponseSchema {
  accountName: string
  totalReserve: string
  totalToken: string
  updatedAt: string
  ripcord: boolean
  ripcordDetails: string[]
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const porTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => ({
      params: [param],
      request: {
        baseURL: config.API_ENDPOINT,
        method: 'GET',
        url: `/${param.fundId}/reserves`,
        headers: {
          'x-api-key': config.API_KEY,
        },
      },
    }))
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      try {
        const { ripcord, ripcordAsInt } = checkRipcord(res.data)
        const totalReserve = parseNumber(res.data.totalReserve, 'totalReserve')
        const updatedAt = parseTimestampMs(res.data.updatedAt)

        return {
          params: param,
          response: {
            result: totalReserve,
            data: {
              result: totalReserve,
              totalReserves: totalReserve,
              ripcord,
              ripcordAsInt,
            },
            statusCode: 200,
            timestamps: {
              providerIndicatedTimeUnixMs: updatedAt,
            },
          },
        }
      } catch (error) {
        if (error instanceof ProviderDataError) {
          return {
            params: param,
            response: { errorMessage: error.message, statusCode: 502 },
          }
        }
        throw error
      }
    })
  },
})
