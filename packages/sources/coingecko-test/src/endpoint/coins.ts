import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config, DEFAULT_API_ENDPOINT, PRO_API_ENDPOINT } from '../config'

export const inputParameters = {} satisfies InputParameters

interface CoinsResponse {
  id: string
  symbol: string
  name: string
}

type EndpointTypes = {
  Request: {
    Params: unknown
  }
  Response: {
    Data: CoinsResponse[]
    Result: null
  }
  Settings: typeof config.settings
  Provider: {
    RequestBody: never
    ResponseBody: CoinsResponse[]
  }
}

const transport = new HttpTransport<EndpointTypes>({
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

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'coins',
  transport,
  inputParameters,
})
