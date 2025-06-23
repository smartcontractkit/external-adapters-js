import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/nav'

export interface ResponseSchema {
  ticker: string
  relatedTicker: string
  name: string
  dt: string
  nav: number
  sharesOutstanding: number
  aum: number
  navPrevious: number
  navDelta: number
  navDeltaPCT: number
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
          url: '/funddetails/nav',
          params: {
            ticker: param.ticker.toUpperCase(),
          },
        },
      }
    })
  },
  parseResponse: (params, response) => {
    // console.log(response)
    if (!response.data) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any value for ${param.ticker}`,
            statusCode: 502,
          },
        }
      })
    }

    return params.map((param) => {
      const result = response.data.nav
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
