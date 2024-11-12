import { getApiEndpoint, getApiHeaders } from '../config'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes, CoinsResponse } from '../endpoint/coins'

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: CoinsResponse[]
  }
}

export const transport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    const baseURL = getApiEndpoint(config)
    return {
      params,
      request: {
        baseURL,
        url: '/v1/coins',
        method: 'GET',
        headers: getApiHeaders(config),
      },
    }
  },
  parseResponse: (params, res) => {
    return [
      {
        params,
        response: {
          data: res.data,
          statusCode: 200,
          result: null,
        },
      },
    ]
  },
})
