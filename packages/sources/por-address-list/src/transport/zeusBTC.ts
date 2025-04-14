import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/zeusBTC'

interface ResponseSchema {
  accountName: string
  result: {
    id: string
    address: string
    symbol: string
    addressType: string
    balance: string
    walletName: string
  }[]
  count: number
  totalReserveinBtc: string
  totalToken: string
  lastUpdatedAt: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}
export const zeusHttpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return {
      params,
      request: {
        baseURL: config.ZEUS_BTC_API_ENDPOINT,
      },
    }
  },
  parseResponse: (_params, response) => {
    if (!response.data) {
      return [
        {
          params: {},
          response: {
            errorMessage: `The data provider didn't return any data for zeusBTC`,
            statusCode: 502,
          },
        },
      ]
    }

    const addresses = getAddresses(response.data)

    if (addresses.length == 0) {
      return [
        {
          params: {},
          response: {
            errorMessage: `The data provider didn't return any address for zeusBTC`,
            statusCode: 502,
          },
        },
      ]
    }

    return [
      {
        params: {},
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

const getAddresses = (data: ResponseSchema) => {
  return data.result.map((d) => ({
    address: d.address,
    network: 'bitcoin',
    chainId: 'mainnet',
  }))
}
