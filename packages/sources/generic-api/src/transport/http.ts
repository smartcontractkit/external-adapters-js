import {
  HttpTransport,
  HttpTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import * as objectPath from 'object-path'
import { getApiConfig } from '../config'
import { BaseEndpointTypes } from '../endpoint/http'

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: object
  }
}

const transportConfig: HttpTransportConfig<HttpTransportTypes> = {
  prepareRequests: (params) => {
    return params.map((param) => {
      const apiConfig = getApiConfig(param.apiName)
      return {
        params: [param],
        request: {
          baseURL: apiConfig.url,
          ...(apiConfig.authHeader
            ? {
                headers: {
                  [apiConfig.authHeader]: apiConfig.authHeaderValue,
                },
              }
            : {}),
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
            errorMessage: `The data provider for ${param.apiName} didn't return any value`,
            statusCode: 502,
          },
        }
      })
    }

    return params.map((param) => {
      if (
        param.ripcordPath !== undefined &&
        objectPath.has(response.data, param.ripcordPath) &&
        objectPath.get(response.data, param.ripcordPath).toString() !== param.ripcordDisabledValue
      ) {
        return {
          params: param,
          response: {
            errorMessage: `Ripcord activated for '${param.apiName}'`,
            statusCode: 503,
          },
        }
      }

      if (!objectPath.has(response.data, param.dataPath)) {
        return {
          params: param,
          response: {
            errorMessage: `Data path '${param.dataPath}' not found in response for '${param.apiName}'`,
            statusCode: 500,
          },
        }
      }
      const result = objectPath.get(response.data, param.dataPath).toString()
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
}

// Exported for testing
export class GenericApiHttpTransport extends HttpTransport<HttpTransportTypes> {
  constructor() {
    super(transportConfig)
  }
}

export const httpTransport = new GenericApiHttpTransport()
