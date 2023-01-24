import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { EmptyObject } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { customSettings, getApiEndpoint, getApiHeaders } from '../config'
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
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: never
    ResponseBody: CoinsResponse[]
  }
}

const httpTransport = new HttpTransport<EndpointTypes>({
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

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'coins',
  transport: httpTransport,
  inputParameters,
})
