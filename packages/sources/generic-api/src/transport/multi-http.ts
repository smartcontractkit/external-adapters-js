import {
  HttpTransport,
  HttpTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import * as objectPath from 'object-path'
import { BaseEndpointTypes, RequestParams } from '../endpoint/multi-http'
import { prepareRequests } from './utils'

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: object
  }
}

const transportConfig: HttpTransportConfig<HttpTransportTypes> = {
  prepareRequests: (params) => {
    console.log(params)
    return prepareRequests(params as unknown as RequestParams[])
  },
  parseResponse: (params, response) => {
    console.log(response.data)
    const typedParams = params as unknown as RequestParams[]

    if (!response.data) {
      return typedParams.map((param) => ({
        params: param,
        response: {
          errorMessage: `The data provider for ${param.apiName} didn't return any value`,
          statusCode: 502,
        },
      }))
    }

    return typedParams.map((param) => {
      // Check ripcord
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

      // Extract all dataPaths
      const data: { [key: string]: unknown } = {}
      for (const { name, path } of param.dataPaths) {
        if (!objectPath.has(response.data, path)) {
          return {
            params: param,
            response: {
              errorMessage: `Data path '${path}' not found in response for '${param.apiName}'`,
              statusCode: 500,
            },
          }
        }
        data[name] = objectPath.get(response.data, path)
      }

      return {
        params: param,
        response: {
          result: null,
          data,
        },
      }
    })
  },
}

// Exported for testing
export class MultiHttpTransport extends HttpTransport<HttpTransportTypes> {
  constructor() {
    super(transportConfig)
  }
}

export const multiHttpTransport = new MultiHttpTransport()
