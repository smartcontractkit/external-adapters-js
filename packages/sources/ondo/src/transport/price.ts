import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/price'

export interface ProviderResponseSchema {
  primaryMarket: {
    symbol: string
    price: string
  }
  underlyingMarket: {
    ticker: string
    price: string
  }
  timestamp: number
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseSchema
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: `v1/assets/${param.asset}/prices/latest`,
          headers: {
            'x-api-key': config.API_KEY,
          },
        },
      }
    })
  },
  parseResponse: (params, response) => {
    if (!response.data || isNaN(Number(response.data.primaryMarket?.price))) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any value for ${param.asset}`,
            statusCode: 502,
          },
        }
      })
    }

    const timestamps = {
      providerIndicatedTimeUnixMs: response.data.timestamp,
    }
    const result = Number(response.data.primaryMarket.price)

    return params.map((param) => {
      return {
        params: param,
        response: {
          result,
          data: {
            result,
          },
          timestamps,
        },
      }
    })
  },
})
