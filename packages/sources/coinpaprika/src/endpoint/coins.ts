import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import { config, getApiEndpoint, getApiHeaders } from '../config'

interface CoinsResponse {
  id: string
  symbol: string
  name: string
  rank: number
}

type EndpointTypes = {
  Settings: typeof config.settings
  Parameters: EmptyInputParameters
  Response: {
    Data: CoinsResponse[]
    Result: null
  }
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
})
