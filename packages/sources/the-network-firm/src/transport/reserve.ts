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

export const getApiKey = (apiKey: string, config: BaseEndpointTypes['Settings']) => {
  if (apiKey) {
    const apiKeyName = `${apiKey.toUpperCase()}_API_KEY`
    const apiKeyValue = process.env[apiKeyName]

    if (!apiKeyValue) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Missing '${apiKeyName}' environment variables.`,
      })
    }

    return apiKeyValue
  }

  return config.API_KEY
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    const client = params[0].client
    const resource = params[0].resource
    return {
      params,
      request: {
        baseURL: config.ALT_API_ENDPOINT,
        url: `/v1/${client}/${resource}`,
        headers: {
          apikey: getApiKey(params[0].apiKey, config),
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

      const client = params[0].client
      if (!response.data.name || response.data.name !== client) {
        return {
          params: param,
          response: {
            errorMessage: 'Provider did not return resource for client',
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
