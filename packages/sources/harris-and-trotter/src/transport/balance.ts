import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/balance'
import { getApiKeys } from './utils'

export interface ResponseSchema {
  accountName: string
  totalReserve: number
  totalToken: number
  timestamp: string
  ripcord: boolean
  ripcordDetails: {
    insufficient_balance: boolean
    source_failure: boolean
    external_intervention: boolean
  }
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
          url: '/balances',
          headers: {
            'x-functions-key': getApiKeys(param.apiKey, config),
          },
          params: {
            client_name: param.clientName,
          },
        },
      }
    })
  },
  parseResponse: (params, response) => {
    // Return error if ripcord indicator true
    if (response.data.ripcord) {
      const message = `Ripcord indicator true. Details: ${JSON.stringify(
        response.data.ripcordDetails,
      )}`
      return [
        {
          params: params[0],
          response: {
            errorMessage: message,
            ripcord: response.data.ripcord,
            ripcordDetails: JSON.stringify(response.data.ripcordDetails),
            statusCode: 502,
            timestamps: {
              providerIndicatedTimeUnixMs: new Date(response.data.timestamp).getTime(),
            },
          },
        },
      ]
    }

    const result = response.data.totalReserve

    if (typeof result === 'undefined') {
      return [
        {
          params: params[0],
          response: {
            errorMessage: `Response missing totalReserve`,
            statusCode: 502,
            timestamps: {
              providerIndicatedTimeUnixMs: new Date(response.data.timestamp).getTime(),
            },
          },
        },
      ]
    }

    return [
      {
        params: params[0],
        response: {
          result,
          data: {
            result,
            ripcord: response.data.ripcord,
          },
          timestamps: {
            providerIndicatedTimeUnixMs: new Date(response.data.timestamp).getTime(),
          },
        },
      },
    ]
  },
})
