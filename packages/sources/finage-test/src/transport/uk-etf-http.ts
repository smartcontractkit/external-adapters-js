import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { EquitiesEndpointTypes } from '../endpoint/utils'

interface ResponseSchema {
  symbol: string
  price: number
  timestamp: number
  error?: string
}

type HttpTransportTypes = EquitiesEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const symbol = param.base?.toUpperCase()
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: `/last/etf/${symbol}`,
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
              "Could not retrieve valid data from Data Provider's /last/etf API. This is likely an issue with the Data Provider or the input params/overrides",
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
            result: res.data.price,
          },
          result: res.data.price,
          timestamps: {
            providerIndicatedTimeUnixMs: res.data.timestamp,
          },
        },
      }
    })
  },
})
