import { DEFAULT_API_ENDPOINT, PRO_API_ENDPOINT } from '../config'
import { BaseEndpointTypes, CoinsResponse } from '../endpoint/coins'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: CoinsResponse[]
  }
}
export const transport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, settings) => {
    const baseURL = settings.API_KEY ? PRO_API_ENDPOINT : DEFAULT_API_ENDPOINT
    const queryParams = settings.API_KEY ? { x_cg_pro_api_key: settings.API_KEY } : undefined
    return {
      params,
      request: {
        baseURL,
        url: '/coins/list',
        method: 'GET',
        params: queryParams,
      },
    }
  },
  parseResponse: (params, res) => [
    {
      params,
      response: {
        data: res.data,
        statusCode: 200,
        result: null,
      },
    },
  ],
})
