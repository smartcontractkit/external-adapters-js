import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/eod'

interface ResponseSchema {
  symbol: string
  totalResults: number
  error?: string
  results: [
    {
      o: number
      h: number
      l: number
      c: number
      v: number
      t: number
    },
  ]
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const transport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: `/agg/stock/prev-close/${param.base}`,
          params: { apikey: config.API_KEY },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    if (res.data.error) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage:
              'Could not retrieve valid data from Data Provider. This is likely an issue with the Data Provider or the input params/overrides',
            statusCode: 400,
          },
        }
      })
    }

    return params.map((param) => {
      return {
        params: param,
        response: {
          data: {
            result: res.data.results[0].c,
          },
          result: res.data.results[0].c,
          timestamps: {
            providerIndicatedTimeUnixMs: res.data.results[0].t,
          },
        },
      }
    })
  },
})
