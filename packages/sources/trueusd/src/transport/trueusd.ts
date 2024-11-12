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
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
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
            ripcord: response.data.ripcord,
            ripcordDetails: response.data.ripcordDetails.join(', '),
            statusCode: 502,
            timestamps: {
              providerIndicatedTimeUnixMs: new Date(response.data.updatedAt).getTime(),
            },
          },
        }
      }

      const chain = param.chain as string
      const resultPath = param.field || ''

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

        const result =
          resultPath === 'totalTrust'
            ? chainData.totalTrustByChain
            : chainData[resultPath as keyof typeof chainData]

        if (isNaN(result as number)) {
          return {
            params: param,
            response: {
              errorMessage: `Value for '${resultPath}' is not a number.`,
              statusCode: 502,
            },
          }
        }

        return {
          params: param,
          response: {
            result: result as number,
            data: {
              result: result as number,
              ripcord: response.data.ripcord,
            },
            timestamps: {
              providerIndicatedTimeUnixMs: new Date(response.data.updatedAt).getTime(),
            },
          },
        }
      }

      const result = response.data[resultPath as keyof typeof response.data]

      if (isNaN(result as number)) {
        return {
          params: param,
          response: {
            errorMessage: `Value for '${resultPath}' is not a number.`,
            statusCode: 502,
          },
        }
      }

      return {
        params: param,
        response: {
          result: result as number,
          data: {
            result: result as number,
            ripcord: response.data.ripcord,
          },
          timestamps: {
            providerIndicatedTimeUnixMs: new Date(response.data.updatedAt).getTime(),
          },
        },
      }
    })
  },
})
