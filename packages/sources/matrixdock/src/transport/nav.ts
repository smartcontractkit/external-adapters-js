import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/nav'
import { getRequestHeaders } from './authentication'

export interface ResponseSchema {
  code: number
  message: string
  data: {
    round_id: string
    last_updated_timestamp: number
    symbol: string
    issue_price: string
    redeem_price: string
  } | null
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
      const method = 'GET'
      const path = '/rwa/api/v1/quote/price'
      const timestamp = Date.now()
      const queryString = `symbol=${param.symbol}`

      const headers = getRequestHeaders({
        method,
        path,
        queryString,
        apiKey: config.API_KEY,
        secret: config.API_SECRET,
        timestamp,
      })

      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: path,
          params: { symbol: param.symbol },
          headers,
        },
      }
    })
  },
  parseResponse: (params, response) => {
    return params.map((param) => {
      const apiResponse = response.data

      if (apiResponse.code !== 0 || !apiResponse.data) {
        return {
          params: param,
          response: {
            errorMessage: apiResponse.message || 'Unknown error from Matrixdock API',
            statusCode: 502,
          },
        }
      }

      const result = Number(apiResponse.data.issue_price)

      return {
        params: param,
        response: {
          result,
          data: {
            result,
          },
          timestamps: {
            providerIndicatedTimeUnixMs: apiResponse.data.last_updated_timestamp,
          },
        },
      }
    })
  },
})
