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
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: `/v1/tokens/${param.token.toLowerCase()}/reserves`,
        },
      }
    })
  },
  parseResponse: (params, response) => {
    return params.map((param) => {
      if (!response.data?.addresses?.length) {
        return {
          params: param,
          response: {
            statusCode: 502,
            errorMessage: `gemini provided no data for ${JSON.stringify(param)}`,
          },
        }
      }
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
