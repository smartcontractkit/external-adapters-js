import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/rate'

export interface ResponseSchema {
  refRates: {
    effectiveDate: string
    type: string
    percentRate?: number
  }[]
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
      const result = response.data.refRates.find(
        (d) => d.type.toUpperCase() == param.rate.toUpperCase(),
      )
      if (result == undefined || result.percentRate == undefined) {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any value for ${param.rate}`,
            statusCode: 502,
          },
        }
      } else {
        return {
          params: param,
          response: {
            result: result.percentRate,
            data: {
              result: result.percentRate,
            },
            timestamps: {
              providerIndicatedTimeUnixMs: new Date(result.effectiveDate).getTime(),
            },
          },
        }
      }
    })
  },
})
