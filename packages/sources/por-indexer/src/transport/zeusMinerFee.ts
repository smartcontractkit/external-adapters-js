import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/zeusMinerFee'

interface ResponseSchema {
  accountName: string
  result: {
    id: number
    address: string
    symbol: string
    addressType: string
    balance: string
    walletName: string
  }[]
  count: number
  totalReserveinBtc: string
  totalToken: string
  minerFees: string
  lastUpdatedAt: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return {
      params: params,
      request: {
        baseURL: config.ZEUS_ZBTC_API_URL,
      },
    }
  },

  parseResponse: (params, response) => {
    const payload = response.data

    if (!payload || payload?.minerFees == null) {
      return [
        {
          params: params[0],
          response: {
            errorMessage: `The data provider didn't return any value`,
            statusCode: 502,
          },
        },
      ]
    }

    const result = payload.minerFees

    const timestamps = {
      providerIndicatedTimeUnixMs: new Date(response.data.lastUpdatedAt).getTime(),
    }

    return [
      {
        params: params[0],
        response: {
          result,
          data: {
            result,
          },
          timestamps,
        },
      },
    ]
  },
})
