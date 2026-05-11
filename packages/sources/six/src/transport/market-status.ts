import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/market-status'

export interface ResponseSchema {
  [key: string]: {
    price: number
    errorMessage?: string
  }
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
          url: '/cryptocurrency/price',
          headers: {
            X_API_KEY: config.API_KEY,
          },
          params: {
            symbol: param.base.toUpperCase(),
            convert: param.quote.toUpperCase(),
          },
        },
      }
    })
  },
  parseResponse: (params, response) => {
    return params.map((param) => {
      const baseSymbol = param.base.toUpperCase()
      if (!response.data || !response.data[baseSymbol]) {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any value for ${param.base}/${param.quote}`,
            statusCode: 502,
          },
        }
      }

      const result = response.data[baseSymbol].price
      return {
        params: param,
        response: {
          result,
          data: {
            result,
          },
        },
      }
    })
  },
})
