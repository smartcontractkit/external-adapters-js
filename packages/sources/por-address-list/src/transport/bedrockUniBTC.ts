import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/bedrockBTC'

interface ResponseSchema {
  btc: string[]
  evm: {
    [key: string]: string
  }
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}
export const bedrockHttpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.BEDROCK_UNIBTC_API_ENDPOINT,
        },
      }
    })
  },
  parseResponse: (params, response) => {
    if (!response.data || response.data.btc.length == 0) {
      return [
        {
          params: params[0],
          response: {
            errorMessage: `The data provider didn't return any address for solvBTC`,
            statusCode: 502,
          },
        },
      ]
    }

    const addresses = response.data.btc
      .map((adr) => ({
        address: adr,
        network: 'bitcoin',
        chainId: 'mainnet',
      }))
      .sort()

    return [
      {
        params: params[0],
        response: {
          result: null,
          data: {
            result: addresses,
          },
        },
      },
    ]
  },
})
