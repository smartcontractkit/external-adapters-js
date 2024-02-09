import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { UkEtfEndpointTypes } from '../endpoint/utils'
import {
  EtfResponseSchema,
  makeEtfHttpError,
  makeEtfHttpRequest,
  makeEtfHttpResponse,
} from './utils'

type HttpTransportTypes = UkEtfEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: EtfResponseSchema
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return makeEtfHttpRequest(config, param, param.base.toUpperCase(), param.country)
    })
  },
  parseResponse: (params, res) => {
    if (res.data.error) {
      return makeEtfHttpError(params)
    }
    return makeEtfHttpResponse(params, res.data.price, res.data.timestamp)
  },
})
