import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/nav'

export interface ResponseSchema {
  totalCollateral: number
  totalOwedM: number
  collateralisation: number
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: {
      method: string
    }
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
          url: '/api/dashboard-backend-api/api/rpc',
          method: 'POST',
          data: { method: 'navDetails' },
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
            errorMessage: `The data provider didn't return any value`,
            statusCode: 502,
          },
        }
      })
    }

    return params.map((param) => {
      // total collateral: eligible and non eligible treasuries and cash, in micro dollar denomination
      const result = response.data['totalCollateral']
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
