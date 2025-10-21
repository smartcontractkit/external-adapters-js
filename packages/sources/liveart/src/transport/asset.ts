import { HttpTransport } from '@chainlink/external-adapter-framework/transports/http'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config/config'
import { inputParameters } from '../endpoint/asset'
import { Asset } from './types'

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Data: Asset
    Result: null
  }
  Settings: typeof config.settings
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: Asset
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, adapterSettings) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: adapterSettings.API_BASE_URL,
          url: `/asset/${param.asset_id}`,
        },
      }
    })
  },
  parseResponse: (params, response) => {
    return params.map((param: TypeFromDefinition<typeof inputParameters.definition>) => {
      if (param.asset_id !== response.data.asset_id) {
        return {
          params: param,
          response: {
            errorMessage: `Mismatched asset_id in response. Expected ${param.asset_id}, got ${response.data.asset_id}`,
            statusCode: 500,
          },
        }
      }

      return {
        params: param,
        response: {
          result: null,
          data: response.data,
        },
      }
    })
  },
})
