import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
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

const logger = makeLogger('ReserveStreamsHTTPTransport')

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
          baseURL: config.ALT_API_ENDPOINT,
          url: client,
          headers: {
            apikey: getApiKey(client),
          },
        },
      }
    })
  },
  parseResponse: (params, response) => {
    return params.map((param) => {
      const laxRipcord = param.laxRipcord

      const ripcord =
        response.data.ripcord || response.data.ripcord.toString().toLowerCase() === 'true'
      const ripcordAsInt = ripcord ? 1 : 0

      // Populate ripcord details if ripcord is true
      if (ripcord) {
        const ripcordDetails = response.data.ripcordDetails.join(', ')

        // If laxRipcord is false and ripcord is true return 502
        if (!laxRipcord) {
          const message = `Ripcord indicator true. Details: ${ripcordDetails}`
          return {
            params: param,
            response: {
              errorMessage: message,
              ripcord: response.data.ripcord,
              ripcordAsInt,
              ripcordDetails,
              statusCode: 502,
              timestamps: {
                providerIndicatedTimeUnixMs: new Date(response.data.timestamp).getTime(),
              },
            },
          }
        }

        logger.debug(`Ripcord indicator true. Details: ${ripcordDetails}`)
      }

      // Ensure totalReserve and totalToken are numbers, keep result as is for backwards compatibility
      const result = response.data.totalReserve
      const totalReserve = Number(result)
      const totalToken = Number(response.data.totalToken)
      return {
        params: param,
        response: {
          result,
          data: {
            result,
            ripcord: response.data.ripcord,
            ripcordAsInt,
            totalReserve,
            totalToken,
          },
          timestamps: {
            providerIndicatedTimeUnixMs: new Date(response.data.timestamp).getTime(),
          },
        },
      }
    })
  },
})
