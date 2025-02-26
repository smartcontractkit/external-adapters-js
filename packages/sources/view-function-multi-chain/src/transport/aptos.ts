import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/aptos'

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: { function: string; type_arguments: string[]; arguments: string[] }
    ResponseBody:
      | string[]
      | {
          message: string
          error_code: string
          vm_error_code: number
        }
  }
}
export const aptosTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.APTOS_URL,
          url: '/view',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            function: param.signature,
            type_arguments: param.type,
            arguments: param.arguments,
          },
        },
      }
    })
  },
  parseResponse: (params, response) => {
    if (response.data instanceof Array) {
      return [
        {
          params: params[0],
          response: {
            result: response.data[0],
            data: {
              result: response.data[0],
            },
          },
        },
      ]
    } else {
      return [
        {
          params: params[0],
          response: {
            errorMessage: JSON.stringify(response.data),
            statusCode: 502,
          },
        },
      ]
    }
  },
})
