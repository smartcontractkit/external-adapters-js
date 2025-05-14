import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/aptos'
import { doPrepareRequests, ErrorObj, RequestObj } from '../utils/aptos-common'

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: RequestObj
    ResponseBody: any[] | ErrorObj
  }
}

export const aptosTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params) => {
    return params.map((param) => {
      const request = doPrepareRequests(
        param.networkType,
        param.signature,
        param.type,
        param.arguments,
      )
      return {
        params: [param],
        ...request,
      }
    })
  },
  parseResponse: (params, response) => {
    if (!(response.data instanceof Array)) {
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
  },
})
