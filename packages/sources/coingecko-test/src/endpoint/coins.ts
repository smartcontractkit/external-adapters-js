import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SettingsMap } from '@chainlink/external-adapter-framework/config'
import { RestTransport } from '@chainlink/external-adapter-framework/transports'
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
    Data: CoinsResponse
    Result: null
  }
  CustomSettings: SettingsMap
  Provider: {
    RequestBody: never
    ResponseBody: CoinsResponse
  }
}

const restEndpointTransport = new RestTransport<EndpointTypes>({
  prepareRequest: (_, config) => {
    const baseURL = config.API_KEY ? PRO_API_ENDPOINT : DEFAULT_API_ENDPOINT
    const params = config.API_KEY ? { x_cg_pro_api_key: config.API_KEY } : undefined
    return {
      baseURL,
      url: '/coins/list',
      method: 'GET',
      params,
    }
  },
  parseResponse: (req, res) => {
    return {
      data: res.data,
      statusCode: 200,
      result: null,
    }
  },
  options: {
    requestCoalescing: {
      enabled: true,
    },
  },
})

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'coins',
  transport: restEndpointTransport,
  inputParameters,
})
