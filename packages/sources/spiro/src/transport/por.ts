import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import type { BaseEndpointTypes } from '../endpoint/por'
import { checkRipcord } from './utils'

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
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          method: 'GET',
          url: `/api/chainlink/funds/${param.fundId}/reserves`,
          headers: {
            'x-api-key': config.API_KEY,
          },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      const { fundId } = param
      const { ripcord, ripcordAsInt, message } = checkRipcord(res.data, param.noErrorOnRipcord)
      if (message) {
        return {
          params: param,
          response: {
            errorMessage: message,
            statusCode: 502,
          },
        }
      }

      const result = Number(res.data.totalReserve)
      if (res.data.totalReserve == null || !Number.isFinite(result)) {
        return {
          params: param,
          response: {
            errorMessage:
              res.data.totalReserve == null
                ? `The data provider did not return any value for fundId: ${fundId}`
                : `The data provider did not return a valid totalReserve for fundId: ${fundId}`,
            statusCode: 502,
          },
        }
      }

      return {
        params: param,
        response: {
          result,
          data: {
            result,
            totalReserves: result,
            ripcord,
            ripcordAsInt,
          },
          timestamps: {
            providerIndicatedTimeUnixMs: Date.parse(res.data.updatedAt),
          },
        },
      }
    })
  },
})
