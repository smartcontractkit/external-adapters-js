import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/nav'

export interface ResponseSchema {
  equityNav: number
  seniorNAV: number
  juniorNav: number
  totalCollateral: number
  totalAccounts: number
  totalLiability: number
  updateDateTime: string
  assetId: string
}

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
          url: config.API_NAV_ENDPOINT,
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
      const equityNav = response.data.equityNav
      if (equityNav) {
        return {
          params: param,
          response: {
            result: Number(response.data.equityNav),
            data: {
              result: Number(response.data.equityNav),
              timestamps: {
                providerIndicatedTimeUnixMs: Number(response.data.updateDateTime) * 1000,
              },
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
