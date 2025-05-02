import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes } from '../endpoint/nav'

export interface ResponseSchema {
  value: string
  timestamp_ms: number
  integration: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

const normalizeIntegrationForEnvVar = (integration: string): string => {
  return integration.toUpperCase().replace(/-/g, '_')
}

export const getApiKey = (integration: string): string => {
  const envVarIntegration = normalizeIntegrationForEnvVar(integration)
  const apiKey = process.env[`${envVarIntegration}_API_KEY`]

  if (!apiKey) {
    throw new AdapterError({
      message: `missing ${envVarIntegration}_API_KEY`,
      statusCode: 500,
    })
  }

  return apiKey
}

const getApiEndpoint = (integration: string, defaultEndpoint: string): string => {
  const normalizedIntegration = normalizeIntegrationForEnvVar(integration)
  return process.env[`${normalizedIntegration}_API_ENDPOINT`] || defaultEndpoint
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const integrationName = param.integration.toLowerCase()
      const apiKey = getApiKey(integrationName)
      const apiEndpoint = getApiEndpoint(integrationName, config.DEFAULT_API_ENDPOINT)
      return {
        params: [param],
        request: {
          baseURL: apiEndpoint,
          url: `${integrationName}/nav`,
          headers: {
            'x-api-key': apiKey,
          },
        },
      }
    })
  },
  parseResponse: (params, response) => {
    if (response.data?.value == null) {
      // allows for answer = 0
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any value for ${param.integration}`,
            statusCode: 502,
          },
        }
      })
    }

    const timestamps = {
      providerIndicatedTimeUnixMs: response.data.timestamp_ms,
    }

    return params.map((param) => {
      const result = Number(response.data.value)
      return {
        params: param,
        response: {
          result,
          data: {
            result,
          },
          timestamps,
        },
      }
    })
  },
})
