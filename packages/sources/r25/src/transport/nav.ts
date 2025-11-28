import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/nav'
import { getRequestHeaders } from './authentication'

export interface ResponseSchema {
  code: string
  success: boolean
  message: string
  data: {
    lastUpdate: string
    tokenName: string
    chainType: string
    totalSupply: number
    totalAsset: number
    currentNav: string
  }
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
      const method = 'GET'
      const path = '/api/public/current/nav'
      const timestamp = Date.now()

      const queryParams = {
        chainType: param.chainType,
        tokenName: param.tokenName,
      }

      const headers = getRequestHeaders({
        method,
        path,
        params: queryParams,
        apiKey: config.API_KEY,
        secret: config.API_SECRET,
        timestamp,
      })

      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: path,
          params: queryParams,
          headers,
        },
      }
    })
  },
  parseResponse: (params, response) => {
    return params.map((param) => {
      if (!response.data.success) {
        return {
          params: param,
          response: {
            errorMessage: response.data.message || 'Request failed',
            statusCode: 502,
          },
        }
      }

      const currentNav = Number(response.data.data.currentNav)
      const lastUpdate = response.data.data.lastUpdate

      return {
        params: param,
        response: {
          result: currentNav,
          data: {
            result: currentNav,
          },
          timestamps: {
            providerIndicatedTimeUnixMs: new Date(lastUpdate).getTime(),
          },
        },
      }
    })
  },
})
