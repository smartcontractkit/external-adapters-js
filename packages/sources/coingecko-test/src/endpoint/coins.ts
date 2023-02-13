import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SettingsMap } from '@chainlink/external-adapter-framework/config'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { EmptyObject } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { DEFAULT_API_ENDPOINT, PRO_API_ENDPOINT } from '../config'

export const inputParameters: InputParameters = {}

interface CoinsResponse {
  id: string
  symbol: string
  name: string
}

type EndpointTypes = {
  Request: {
    Params: EmptyObject
  }
  Response: {
    Data: CoinsResponse[]
    Result: null
  }
  CustomSettings: SettingsMap
  Provider: {
    RequestBody: never
    ResponseBody: CoinsResponse[]
  }
}

const transport = new HttpTransport<EndpointTypes>({
  prepareRequests: (params, config) => {
    const baseURL = config.API_KEY ? PRO_API_ENDPOINT : DEFAULT_API_ENDPOINT
    const queryParams = config.API_KEY ? { x_cg_pro_api_key: config.API_KEY } : undefined
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

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'coins',
  transport,
  inputParameters,
})
