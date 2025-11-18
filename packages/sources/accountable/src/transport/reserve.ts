import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes } from '../endpoint/reserve'

export interface ResponseSchema {
  client: string
  totalReserve: number
  totalSupply: number
  underlyingAssets: {
    name: string
    value: number
  }[]
  collateralization: number
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
    return params.map((param) => {
      const client = param.client
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          params: {
            client: client,
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getApiKey(client)}`,
          },
        },
      }
    })
  },
  parseResponse: (params, response) => {
    return params.map((param) => {
      const result = response.data.totalReserve
      const totalReserve = Number(result)
      return {
        params: param,
        response: {
          result,
          data: {
            result,
            totalReserve,
            ripcord: false,
          },
        },
      }
    })
  },
})
