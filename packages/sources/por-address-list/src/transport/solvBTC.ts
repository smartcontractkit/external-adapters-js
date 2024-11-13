import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/solvBTC'

interface ResponseSchema {
  accountName: string
  result: {
    id: number
    address: string
    symbol: string
    addressType: string
    walletName: string
  }[]
  count: number
  lastUpdatedAt: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}
export const solvHttpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.SOLVBTC_API_ENDPOINT,
        },
      }
    })
  },
  parseResponse: (params, response) => {
    const timestamps = {
      providerIndicatedTimeUnixMs: new Date(response.data.lastUpdatedAt).getTime(),
    }

    if (!response.data || response.data.result.length == 0) {
      return [
        {
          params: params[0],
          response: {
            errorMessage: `The data provider didn't return any address for solvBTC`,
            statusCode: 502,
            timestamps: timestamps,
          },
        },
      ]
    }

    const addresses = response.data.result
      .map((r) => ({
        address: r.address,
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
          timestamps: timestamps,
        },
      },
    ]
  },
})
