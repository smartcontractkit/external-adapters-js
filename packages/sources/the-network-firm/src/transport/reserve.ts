import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes } from '../endpoint/reserve'

export interface ResponseSchema {
  name: string
  totalReserve: number
  totalToken: number
  ripcord: boolean
  ripcordDetails: string[]
  timestamp: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const getApiKey = (client: string) => {
  const apiKeyName = `${client.replace(/-/g, '_').toUpperCase()}_API_KEY`
  const apiKeyValue = process.env[apiKeyName]

  if (!apiKeyValue) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Missing '${apiKeyName}' environment variables.`,
    })
  }

  return apiKeyValue
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    const client = params[0].client
    return {
      params,
      request: {
        baseURL: config.ALT_API_ENDPOINT,
        url: `${config.ALT_API_ENDPOINT}/${client}`,
        headers: {
          apikey: getApiKey(params[0].client),
        },
      },
    }
  },
  parseResponse: (params, response) => {
    return params.map((param) => {
      const ripcord = response.data.ripcord || response.data.ripcord.toString() === 'true'
      if (ripcord) {
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

      const result = response.data
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
