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

export const getApiConfigs = (integration: string): { apiKey: string; apiUrl: string } => {
  const envVarIntegration = normalizeIntegrationForEnvVar(integration)
  const apiKeyEnvVarName = `${envVarIntegration}_API_KEY`
  const apiKey = process.env[apiKeyEnvVarName]

  if (!apiKey) {
    throw new AdapterError({
      message: `missing ${apiKeyEnvVarName}`,
      statusCode: 500,
    })
  }

  const apiUrlEnvVarName = `${envVarIntegration}_API_URL`
  const apiUrl = process.env[apiUrlEnvVarName]

  if (!apiUrl) {
    throw new AdapterError({
      message: `missing ${apiUrlEnvVarName}`,
      statusCode: 500,
    })
  }

  return { apiKey, apiUrl }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params) => {
    return params.map((param) => {
      const { apiKey, apiUrl } = getApiConfigs(param.integration.toLowerCase())
      return {
        params: [param],
        request: {
          baseURL: apiUrl,
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
