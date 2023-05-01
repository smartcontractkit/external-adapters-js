import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { ResponseSchema, buildBatchedRequestBody, constructEntry } from '../price-utils'
import { ForexEndpointTypes } from './forex-router'

export type HttpTransportTypes = ForexEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => buildBatchedRequestBody(params, config),
  parseResponse: (params, res) => constructEntry(res.data, params),
})
