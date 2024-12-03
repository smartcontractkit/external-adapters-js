import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/reserve'

export interface ResponseSchema {
  assetId: string
  totalValue: number
  currencyBase: string
  accountIds: number[]
  updateDateTime: string
}

// HttpTransport extends base types from endpoint and adds additional, Provider-specific types like 'RequestBody', which is the type of
// request body (not the request to adapter, but the request that adapter sends to Data Provider), and 'ResponseBody' which is
// the type of raw response from Data Provider
export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}
// HttpTransport is used to fetch and process data from a Provider using HTTP(S) protocol. It usually needs two methods
// `prepareRequests` and `parseResponse`
export const httpTransport = new HttpTransport<HttpTransportTypes>({
  // `prepareRequests` method receives request payloads sent to associated endpoint alongside adapter config(environment variables)
  // and should return 'request information' to the Data Provider. Use this method to construct one or many requests, and the framework
  // will send them to Data Provider
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        // `params` are parameters associated to this single request and will also be available in the 'parseResponse' method.
        params: [param],
        // `request` contains any valid axios request configuration
        request: {
          baseURL: config.API_BASE_URL,
          url: `${config.API_RESERVE_ENDPOINT}${param}`,
          headers: {
            X_API_KEY: config.API_KEY,
          },
        },
      }
    })
  },
  // `parseResponse` takes the 'params' specified in the `prepareRequests` and the 'response' from Data Provider and should return
  // an array of response objects to be stored in cache. Use this method to construct a list of response objects for every parameter in 'params'
  // and the framework will save them in cache and return to user
  parseResponse: (params, response) => {
    if (!response.data) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any value`,
            statusCode: 502,
          },
        }
      })
    }

    return params.map((param) => {
      const totalValue = response.data.totalValue
      if (totalValue) {
        return {
          params: param,
          response: {
            result: Number(response.data.totalValue),
            data: {
              result: Number(response.data.totalValue),
            },
            timestamps: {
              providerIndicatedTimeUnixMs: Number(response.data.updateDateTime) * 1000,
            },
          },
        }
      } else {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any value for asset id: ${param}`,
            statusCode: 502,
          },
        }
      }
    })
  },
})
