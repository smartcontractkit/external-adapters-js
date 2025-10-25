import { HttpTransport } from '@chainlink/external-adapter-framework/transports/http'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config/config'
import { Asset } from './types'

export type BaseEndpointTypes = {
  Parameters: EmptyInputParameters
  Response: {
    Data: Asset[]
    Result: null
  }
  Settings: typeof config.settings
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: Asset[]
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, adapterSettings) => {
    return {
      params,
      request: {
        baseURL: adapterSettings.baseURL,
        url: '/assets',
        method: 'GET',
      },
    }
  },
  parseResponse: (params, response) => {
    return [
      {
        params,
        response: {
          data: response.data,
          result: null,
        },
      },
    ]
  },
})
