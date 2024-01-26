import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/trueusd'

interface ResponseSchema {
  accountName: string
  totalTrust: number
  totalToken: number
  updatedAt: string
  token: {
    tokenName: string
    totalTokenByChain: number
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
      // console.log(param)
      // console.log(response.data)
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
            timestamps: {
              providerIndicatedTimeUnixMs: new Date(response.data.updatedAt).getTime(),
            },
          },
        }
      }

      const resultPath = param.field || ''
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
          },
          timestamps: {
            providerIndicatedTimeUnixMs: new Date(response.data.updatedAt).getTime(),
          },
        },
      }
    })
  },
})
