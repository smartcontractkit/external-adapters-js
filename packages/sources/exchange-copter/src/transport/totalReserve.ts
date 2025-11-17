import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/totalReserve'

export interface AccountSchema {
  accountName: string
  totalReserve: number
  totalToken: number
}

export interface ResponseSchema {
  timestamp: string
  accounts: AccountSchema[]
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
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          method: 'GET',
        },
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      const accountName = param.accountName
      const noErrorOnRipcord = param.noErrorOnRipcord

      const ripcord = res.data.ripcord || res.data.ripcord.toString().toLowerCase() === 'true'
      const ripcordAsInt = ripcord ? 1 : 0

      if (ripcord) {
        const ripcordDetails = res.data.ripcordDetails.join(', ')
        const message = `Ripcord indicator true. Details: ${ripcordDetails}`

        if (!noErrorOnRipcord) {
          return {
            params: param,
            response: {
              errorMessage: message,
              ripcord,
              ripcordAsInt,
              ripcordDetails,
              statusCode: 502,
              timestamps: {
                providerIndicatedTimeUnixMs: new Date(res.data.timestamp).getTime(),
              },
            },
          }
        }
      }

      const accountData = res.data.accounts.find(
        (account: AccountSchema) => account.accountName === accountName,
      )

      if (!accountData) {
        return {
          params: param,
          response: {
            errorMessage: `Account ${accountName} not found in response`,
            statusCode: 502,
            timestamps: {
              providerIndicatedTimeUnixMs: new Date(res.data.timestamp).getTime(),
            },
          },
        }
      }

      const result = accountData.totalReserve
      const totalReserve = Number(result)
      const totalToken = Number(accountData.totalToken)

      return {
        params: param,
        response: {
          result,
          data: {
            result,
            ripcord,
            ripcordAsInt,
            totalReserve,
            totalToken,
          },
          timestamps: {
            providerIndicatedTimeUnixMs: new Date(res.data.timestamp).getTime(),
          },
        },
      }
    })
  },
})
