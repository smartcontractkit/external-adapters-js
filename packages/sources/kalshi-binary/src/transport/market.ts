import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/market'
import {
  KalshiMarketResponse,
  buildRequestConfig,
  parseMarketResponse,
} from './utils'

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: KalshiMarketResponse
  }
}

export { KalshiMarketResponse }

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => buildRequestConfig(param, config))
  },
  parseResponse: (params, response) => {
    return parseMarketResponse(params, response)
  },
})
