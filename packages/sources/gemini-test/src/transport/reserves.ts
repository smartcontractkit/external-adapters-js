import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/reserves'

export interface ResponseSchema {
  addresses: string[]
  ethereum_supply: number
  currency: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}
export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: `https://api.gemini.com`,
          url: `/v1/tokens/${param.token.toLowerCase()}/reserves`,
        },
      }
    })
  },
  parseResponse: (params, response) => {
    return params.map((param) => {
      const result = response.data.addresses.map((address) => ({
        address,
        network: param.network,
        chainId: param.chainId,
      }))

      return {
        params: param,
        response: {
          result: null,
          data: {
            ...response.data,
            result,
          },
        },
      }
    })
  },
})
