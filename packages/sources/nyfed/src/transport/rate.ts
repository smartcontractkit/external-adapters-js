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
      const result = response.data.refRates?.find(
        (d) => d.type.toUpperCase() == param.symbol.toUpperCase(),
      )
      if (result?.percentRate == undefined) {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any value for ${param.symbol}`,
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
              providerIndicatedTimeUnixMs: result.effectiveDate
                ? new Date(result.effectiveDate).getTime()
                : undefined,
            },
          },
        }
      }
    })
  },
})
