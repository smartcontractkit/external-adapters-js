import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from './common'

export interface ResponseSchema {
  totalReserves: string
  totalSupply: string
  ripcord: boolean
  ripcordDetails: string[]
  timestamp: string
  ripcordTimestamp: string | null
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => ({
    params,
    request: {
      baseURL: config.WYSTC_API_ENDPOINT,
      url: '/v1/proof-of-reserves/wystc/snapshot',
      headers: {
        'x-api-key': config.WYSTC_API_KEY,
      },
    },
  }),
  parseResponse: (params, response) => {
    return params.map((param) => {
      const timestamps = {
        providerIndicatedTimeUnixMs: new Date(response.data.timestamp).getTime(),
      }

      const { totalReserves, totalSupply } = response.data

      if (isNaN(Number(totalReserves)) || isNaN(Number(totalSupply))) {
        return {
          params: param,
          response: {
            errorMessage: 'Failed to parse totalReserves or totalSupply',
            statusCode: 502,
            timestamps,
          },
        }
      }

      return {
        params: param,
        response: {
          result: totalReserves,
          data: {
            result: totalReserves,
            totalReserves,
            totalSupply,
            ripcord: response.data.ripcord,
            ripcordAsInt: Number(response.data.ripcord),
            ripcordDetails: response.data.ripcordDetails,
          },
          timestamps,
        },
      }
    })
  },
})
