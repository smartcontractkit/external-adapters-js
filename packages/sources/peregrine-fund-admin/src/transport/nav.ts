import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/nav'

export interface ResponseSchema {
  Result: number
  Data: {
    equityNav: number
    seniorNAV: number
    juniorNav: number
    providerIndicatedTimeUnixMs: undefined
  }
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
          params: {
            assetId: params,
          },
        },
      }
    })
  },
  // `parseResponse` takes the 'params' specified in the `prepareRequests` and the 'response' from Data Provider and should return
  // an array of response objects to be stored in cache. Use this method to construct a list of response objects for every parameter in 'params'
  // and the framework will save them in cache and return to user
  parseResponse: (params, response) => {
    return params.map((param) => {
      const resData = response.data

      if (!resData || !resData.Data) {
        return {
          params: param,
          response: {
            errorMessage: 'Missing equityNav in the response',
            statusCode: 502,
          },
        }
      }
      return {
        params: param,
        response: {
          Result: 200,
          Data: {
            equityNav: resData.Data.equityNav,
            seniorNAV: resData.Data.seniorNAV,
            juniorNav: resData.Data.juniorNav,
            providerIndicatedTimeUnixMs: Date.now(),
          },
        },
      }
    })
  },
})
