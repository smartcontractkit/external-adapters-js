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
      // Return error if ripcord indicator true
      const providerIndicatedTimeUnixMs = new Date(response.data.updatedAt).getTime()
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
              providerIndicatedTimeUnixMs,
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
            ripcord: response.data.ripcord,
          },
          timestamps: {
            providerIndicatedTimeUnixMs,
          },
        },
      }
    })
  },
})
