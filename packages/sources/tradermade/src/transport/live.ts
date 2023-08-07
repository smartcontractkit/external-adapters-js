import { BaseEndpointTypes } from '../endpoint/live'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { buildIndividualRequests, constructEntry, ResponseSchema } from './utils'

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}
export const transport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => buildIndividualRequests(params, config),
  parseResponse: (params, res) => constructEntry(res.data, params),
})
