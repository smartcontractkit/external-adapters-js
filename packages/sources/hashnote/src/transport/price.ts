import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/price'

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
    if (!response.data) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any value for ${param.base}/${param.quote}`,
            statusCode: 502,
          },
        }
      })
    }

    return params.map((param) => {
      const result = response.data[param.base.toUpperCase()].price
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
