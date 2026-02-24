import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/nav'

export interface ResponseSchema {
  accountName: string
  NAV: string
  updatedAt: string
  ripcord: boolean
  ripcordDetails: string[]
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

/**
 * Extracts timestamp from provider response
 */
export const extractTimestamp = (updatedAt: string): number => {
  return new Date(updatedAt).getTime()
}

/**
 * Parses NAV value from string to number
 */
export const parseNavValue = (nav: string): number => {
  return Number(nav)
}

/**
 * Builds request configuration structure
 */
export const buildRequestConfig = (apiEndpoint: string) => {
  return {
    baseURL: apiEndpoint,
    url: '/nav',
    headers: {
      accept: 'application/json',
    },
  }
}

/**
 * Builds error response structure when no data is returned
 */
export const buildErrorResponse = () => {
  return {
    errorMessage: 'The data provider did not return any value',
    statusCode: 502,
  }
}

/**
 * Builds successful response data structure
 */
export const buildSuccessResponseData = (data: ResponseSchema) => {
  const result = parseNavValue(data.NAV)
  const timestamps = {
    providerIndicatedTimeUnixMs: extractTimestamp(data.updatedAt),
  }

  return {
    result,
    data: {
      result,
      ripcord: data.ripcord,
    },
    timestamps,
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: buildRequestConfig(config.API_ENDPOINT),
      }
    })
  },

  parseResponse: (params, response) => {
    if (!response.data) {
      return params.map((param) => {
        return {
          params: param,
          response: buildErrorResponse(),
        }
      })
    }

    return params.map((param) => {
      return {
        params: param,
        response: buildSuccessResponseData(response.data),
      }
    })
  },
})
