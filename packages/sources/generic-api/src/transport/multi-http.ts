import {
  HttpTransport,
  HttpTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/multi-http'
import { createResponse, prepareRequests } from './utils'

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: object
  }
}

const transportConfig: HttpTransportConfig<HttpTransportTypes> = {
  prepareRequests,
  parseResponse: (params, response) => {
    if (!response.data) {
      return params.map((param) => ({
        params: param,
        response: {
          errorMessage: `The data provider for ${param.apiName} didn't return any value`,
          statusCode: 502,
        },
      }))
    }

    return params.map((param) => {
      return createResponse(param, response)
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
