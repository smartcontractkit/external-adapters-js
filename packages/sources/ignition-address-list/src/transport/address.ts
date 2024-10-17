import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/address'

export interface ResponseSchema {
  total_records: number
  result: {
    address: string
    address_type: string
    balance: number
  }[]
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema & { message: string }
  }
}
export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          headers: {
            'access-token': config.API_KEY,
          },
        },
      }
    })
  },
  parseResponse: (params, response) => {
    return params.map((param) => {
      if (!response.data || response.data.result.length == 0) {
        return {
          params: param,
          response: {
            errorMessage: response.data?.message || `The data provider didn't return any value`,
            statusCode: 502,
          },
        }
      }
      const addresses = response.data.result
        .map((r) => ({
          address: r.address,
          network: param.network,
          chainId: param.chainId,
        }))
        .sort((a, b) => a.address.localeCompare(b.address))

      return {
        params: param,
        response: {
          result: null,
          data: {
            result: addresses,
          },
        },
      }
    })
  },
})
