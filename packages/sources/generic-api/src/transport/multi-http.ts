import {
  HttpTransport,
  HttpTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes } from '../endpoint/multi-http'
import { AdapterErrorWithExtraFields, createResponse, prepareRequests } from './utils'

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: object
  }
}

const transportConfig: HttpTransportConfig<HttpTransportTypes> = {
  prepareRequests,
  parseResponse: (params, response) => {
    return params.map((param) => {
      try {
        return createResponse(param, response)
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        const statusCode = error instanceof AdapterError ? error.statusCode : 502
        const extraFields = error instanceof AdapterErrorWithExtraFields ? error.extraFields : {}

        return {
          params: param,
          response: {
            statusCode,
            errorMessage,
            ...extraFields,
          },
        }
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
