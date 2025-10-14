import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/multiplier'

export interface ResponseSchema {
  activationDateTime: number
  currentMultiplier: number
  newMultiplier: number
  reason: string | null
  error: string
  message: string
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
          url: `${param.tokenSymbol}/multiplier`,
          params: {
            network: param.network,
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
            errorMessage: `The data provider didn't return any value for ${param.tokenSymbol} on network ${param.network}`,
            statusCode: 502,
          },
        }
      })
    }

    if (response.data.error) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: response.data.message,
            statusCode: 502,
          },
        }
      })
    }

    return params.map((param) => {
      const result = response.data.currentMultiplier
      return {
        params: param,
        response: {
          result: result,
          data: response.data,
        },
      }
    })
  },
})
