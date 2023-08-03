import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/trueusd'

interface ResponseSchema {
  accountName: string
  totalTrust: number
  totalToken: number
  updatedAt: string
  token: {
    tokenName: string
    principle: number
    totalTokenByChain: number
    totalTrustByChain: number
    bankBalances: {
      [name: string]: number
    }
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
  prepareRequests: (params) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: 'https://api.real-time-reserves.ledgerlens.io/v1/',
          url: '/chainlink/proof-of-reserves/TrueUSD',
        },
      }
    })
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
            statusCode: 502,
          },
        }
      }

      const chain = param.chain as string

      if (chain) {
        const chainData = response.data.token.find(({ tokenName }) => tokenName.includes(chain))
        if (!chainData) {
          const options = response.data.token.map(({ tokenName }) => tokenName).join(', ')
          return {
            params: param,
            response: {
              errorMessage: `The given "chain" parameter of ${chain} is not found. Available options are one of: ${options}`,
              statusCode: 502,
            },
          }
        }

        const result = chainData.totalTrustByChain
        return {
          params: param,
          response: {
            result,
            data: {
              result,
            },
          },
        }
      }

      const result = response.data.totalTrust
      return {
        params: param,
        response: {
          result,
          data: {
            result,
          },
        },
      }
    })
  },
})
