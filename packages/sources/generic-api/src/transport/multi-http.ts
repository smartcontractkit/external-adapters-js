import {
  HttpTransport,
  HttpTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/multi-http'
import { createResponses, prepareRequests } from './utils'

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: object
  }
}

const transportConfig: HttpTransportConfig<HttpTransportTypes> = {
  prepareRequests,
  parseResponse: (params, response) => {
    return createResponses({
      params,
      response,
      mapParam: (param) => param,
      mapResponse: (response) => response,
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
