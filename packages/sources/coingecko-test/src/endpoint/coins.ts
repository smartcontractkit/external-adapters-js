import { DEFAULT_API_ENDPOINT, PRO_API_ENDPOINT } from '../config'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { RestTransport } from '@chainlink/external-adapter-framework/transports'
import { AdapterRequest, AdapterResponse } from '@chainlink/external-adapter-framework/util'
import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { HttpRequestConfig, HttpResponse } from '@chainlink/external-adapter-framework/transports'

export const inputParameters: InputParameters = {}

export interface CoinsResponse {
  id: string
  symbol: string
  name: string
}

const restEndpointTransport = new RestTransport({
  prepareRequest: (_: AdapterRequest, config: AdapterConfig): HttpRequestConfig<CoinsResponse> => {
    const baseURL = config.API_KEY ? PRO_API_ENDPOINT : DEFAULT_API_ENDPOINT
    const params = config.API_KEY ? { x_cg_pro_api_key: config.API_KEY } : undefined
    return {
      baseURL,
      url: '/coins/list',
      method: 'GET',
      params,
    }
  },
  parseResponse: (
    _: AdapterRequest,
    res: HttpResponse<CoinsResponse[]>,
  ): AdapterResponse<CoinsResponse[]> => {
    return {
      data: res.data,
      statusCode: 200,
      result: res.data,
    }
  },
  options: {
    requestCoalescing: {
      enabled: true,
    },
  },
})

export const endpoint = new AdapterEndpoint({
  name: 'coins',
  transport: restEndpointTransport,
  inputParameters,
})
