import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/reserves-test'
import { ResponseSchema, createRequest, normalizePubkey, parseResponse } from './util'

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => createRequest(params, config.TEST_API_ENDPOINT),
  parseResponse: (params, response, adapterSettings) =>
    parseResponse(params, response.data, normalizePubkey(adapterSettings.TEST_PUBKEY)),
})
