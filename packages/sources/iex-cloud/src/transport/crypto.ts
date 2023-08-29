import { BaseEndpointTypes } from '../endpoint/crypto'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'

interface ResponseSchema {
  symbol: string
  primaryExchange: string
  sector: string
  calculationPrice: string
  high: string
  low: string
  latestPrice: string
  latestSource: string
  latestUpdate: number
  latestVolume: string
  previousClose: string
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
          url: `/crypto/${param.base.toUpperCase()}${param.quote.toUpperCase()}/quote`,
          baseURL: config.API_ENDPOINT,
          params: {
            token: config.API_KEY,
          },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      const result = Number(res.data.latestPrice)

      if (isNaN(result)) {
        return {
          params: param,
          response: {
            errorMessage: `Iex-Cloud provided no data for base "${param.base}" and quote "${param.quote}"`,
            statusCode: 502,
          },
        }
      }
      return {
        params: param,
        response: {
          data: {
            result: result,
          },
          result,
        },
      }
    })
  },
})
