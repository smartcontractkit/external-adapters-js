import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/reserve'

export interface ResponseSchema {
  assetId: string
  totalValue: number
  currencyBase: string
  accountIds: number[]
  updateDateTime: string
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
          baseURL: config.API_BASE_URL,
          url: config.API_RESERVE_ENDPOINT,
          headers: {
            X_API_KEY: config.API_KEY,
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
