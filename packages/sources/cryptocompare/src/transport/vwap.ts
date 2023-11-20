import { BaseEndpointTypes } from '../endpoint/vwap'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'

export interface ResponseSchema {
  [quoteSymbol: string]: number
}

export interface ErrorResponse {
  Message: string
  Response: string
  Type: number
}

type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema | ErrorResponse
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const subMs = param.hours * 60 * 60 * 1000
      const toDate = new Date(new Date().getTime() - subMs)
      toDate.setUTCHours(0, 0, 0, 0)
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: '/data/dayAvg',
          headers: {
            authorization: `Apikey ${config.API_KEY}`,
          },
          params: {
            fsym: param.base.toUpperCase(),
            tsym: param.quote.toUpperCase(),
            toTs: Math.ceil(toDate.getTime() / 1000),
          },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    if (res.data.Response === 'Error') {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: (res.data as ErrorResponse).Message,
            statusCode: 400,
          },
        }
      })
    }

    return params.map((param) => {
      const result = (res.data as ResponseSchema)[param.quote.toUpperCase()]
      return {
        params: param,
        response: {
          data: {
            result,
          },
          result,
        },
      }
    })
  },
})
