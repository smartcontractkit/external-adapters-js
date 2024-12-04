import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/price'

export interface ResponseSchema {
  securityId: string
  lastModifiedTime: number
  closingPrice: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema[]
  }
}
export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          headers: {
            'API-key': config.API_KEY,
            'User-Agent': config.API_USER_AGENT,
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
      const security = response.data.find((r) => r.securityId == param.securityId)
      if (security && !isNaN(Number(security?.closingPrice))) {
        return {
          params: param,
          response: {
            result: Number(security.closingPrice),
            data: {
              result: Number(security.closingPrice),
            },
            timestamps: {
              providerIndicatedTimeUnixMs: security.lastModifiedTime * 1000,
            },
          },
        }
      } else {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any value for ${param.securityId}`,
            statusCode: 502,
          },
        }
      }
    })
  },
})
