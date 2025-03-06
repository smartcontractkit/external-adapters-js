import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/aptos'

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: { function: string; type_arguments: string[]; arguments: string[] }
    ResponseBody:
      | any[]
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
      if (params[0].index >= response.data.length) {
        return [
          {
            params: params[0],
            response: {
              errorMessage: `index ${
                params[0].index
              } is more than result array length ${JSON.stringify(response.data)}`,
              statusCode: 502,
            },
          },
        ]
      }
      return response.data.map((elem, i) => ({
        params: {
          ...params[0],
          index: i,
        },
        response: {
          result: elem,
          data: {
            result: elem,
          },
        },
      }))
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
