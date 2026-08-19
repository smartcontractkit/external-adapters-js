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

export const getApiConfigs = (
  integration: string,
  settings: BaseEndpointTypes['Settings'],
): { apiKey: string; apiUrl: string } => {
  const apiKey = settings.INTEGRATION_API_KEY.get(integration)
  const apiUrl = settings.INTEGRATION_API_URL.get(integration)

  // audit fix, ensure https at the url config level
  if (!apiUrl.startsWith('https://')) {
    const apiUrlEnvVarName = settings.INTEGRATION_API_URL.getEnvVarName(integration)
    throw new AdapterError({
      message: `${apiUrlEnvVarName} does not start with https://`,
      statusCode: 500,
    })
  }

  return { apiKey, apiUrl }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, adapterSettings) => {
    return params.map((param) => {
      const { apiKey, apiUrl } = getApiConfigs(param.integration, adapterSettings)
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
