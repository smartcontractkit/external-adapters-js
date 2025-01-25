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

    const missing = params
      .filter((p) => !response.data.map((s) => s.securityId).includes(p.securityId))
      .map((p) => ({
        params: p,
        response: {
          errorMessage: `The data provider didn't return any value for ${p.securityId}`,
          statusCode: 502,
        },
      }))

    const valid = response.data.map((security) => {
      const params = {
        securityId: security.securityId,
      }
      if (isNaN(Number(security?.closingPrice))) {
        return {
          params,
          response: {
            errorMessage: `The data provider didn't return valid value for ${security.securityId}`,
            statusCode: 502,
          },
        }
      } else {
        return {
          params,
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
      }
    })

    return valid.concat(missing)
  },
})
