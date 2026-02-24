import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/reserves'

export interface ResponseSchema {
  client: string
  totalReserve: number
  totalSupply: number
  underlyingAssets: {
    name: string
    value: number
  }[]
  collateralization: number
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export interface RequestParams {
  client: string
}

export interface AdapterConfig {
  API_ENDPOINT: string
  ACCOUNTABLE_BEARER_TOKEN: string
}

/**
 * Builds a single request configuration for a given parameter
 */
export const buildRequestConfig = (param: RequestParams, config: AdapterConfig) => {
  return {
    params: [param],
    request: {
      baseURL: config.API_ENDPOINT,
      url: '/reserves',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${config.ACCOUNTABLE_BEARER_TOKEN}`,
      },
      params: {
        client: param.client,
      },
    },
  }
}

/**
 * Builds an error response for a parameter when no data is returned
 */
export const buildErrorResponse = (param: RequestParams) => {
  return {
    params: param,
    response: {
      errorMessage: `The data provider didn't return any value for client: ${param.client}`,
      statusCode: 502,
    },
  }
}

/**
 * Builds a success response from the API data
 */
export const buildSuccessResponse = (param: RequestParams, totalReserve: number) => {
  return {
    params: param,
    response: {
      result: totalReserve,
      data: {
        result: totalReserve,
      },
    },
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => buildRequestConfig(param, config))
  },
  parseResponse: (params, response) => {
    if (!response.data) {
      return params.map((param) => buildErrorResponse(param))
    }

    return params.map((param) => buildSuccessResponse(param, response.data.totalReserve))
  },
})
