import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SettingsMap } from '@chainlink/external-adapter-framework/config'
import { EmptyObject } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { DEFAULT_API_ENDPOINT, PRO_API_ENDPOINT } from '../config'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'

export const inputParameters: InputParameters = {}

interface CoinsResponse {
  id: string
  symbol: string
  name: string
  rank: number
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

const httpTransport = new HttpTransport<EndpointTypes>({
  prepareRequests: (params, config) => {
    const baseURL = config.API_KEY ? PRO_API_ENDPOINT : DEFAULT_API_ENDPOINT
    const headers: { Authorization?: string } = {}
    if (config.API_KEY) {
      headers['Authorization'] = config.API_KEY
    }
    return {
      params,
      request: {
        baseURL,
        url: '/v1/coins',
        method: 'GET',
        headers,
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

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'coins',
  transport: httpTransport,
  inputParameters,
})
