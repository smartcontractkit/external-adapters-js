import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { ResponseSchema, buildIndividualRequests, constructEntry } from '../price-utils'
import { ForexEndpointTypes } from './forex-router'

export type HttpTransportTypes = ForexEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => buildIndividualRequests(params, config),
  parseResponse: (params, res) => constructEntry(res.data, params),
})
