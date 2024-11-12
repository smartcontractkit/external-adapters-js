import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/backed'

export interface ResponseSchema {
  timestamp: string
  accounts: {
    accountName: string
    totalReserve: number
    totalToken: number
  }[]
  ripcord: boolean
  ripcordDetails: string[]
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
      params,
      request: {
        baseURL: config.API_ENDPOINT,
        url: '/backed',
      },
    }
  },
  parseResponse: (params, response) => {
    return params.map((param) => {
      // Return error if ripcord indicator true
      if (response.data.ripcord) {
        const message = `Ripcord indicator true. Details: ${response.data.ripcordDetails.join(
          ', ',
        )}`
        return {
          params: param,
          response: {
            errorMessage: message,
            ripcord: response.data.ripcord,
            ripcordDetails: response.data.ripcordDetails.join(', '),
            statusCode: 502,
            timestamps: {
              providerIndicatedTimeUnixMs: new Date(response.data.timestamp).getTime(),
            },
          },
        }
      }

      if (!response.data.accounts || response.data.accounts.length === 0) {
        return {
          params: param,
          response: {
            errorMessage: 'No accounts were returned',
            statusCode: 502,
            timestamps: {
              providerIndicatedTimeUnixMs: new Date(response.data.timestamp).getTime(),
            },
          },
        }
      }

      const result = response.data.accounts.find((account) => {
        return account.accountName.toUpperCase() === param.accountName.toUpperCase()
      })

      if (!result) {
        return {
          params: param,
          response: {
            errorMessage: `Account with name ${param.accountName} could not be found`,
            statusCode: 502,
            timestamps: {
              providerIndicatedTimeUnixMs: new Date(response.data.timestamp).getTime(),
            },
          },
        }
      }

      return {
        params: param,
        response: {
          result: result.totalReserve,
          data: {
            result: result.totalReserve,
            ripcord: response.data.ripcord,
          },
          timestamps: {
            providerIndicatedTimeUnixMs: new Date(response.data.timestamp).getTime(),
          },
        },
      }
    })
  },
})
