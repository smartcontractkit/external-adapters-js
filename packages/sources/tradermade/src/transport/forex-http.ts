import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/forex'
import { buildIndividualRequests, constructEntry, ResponseSchema } from './utils'

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}
export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => buildIndividualRequests(params, config),
  parseResponse: (params, res) => constructEntry(res.data, params),
})
