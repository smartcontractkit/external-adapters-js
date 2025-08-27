import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes } from '../endpoint/nav'

// Example Response
// {
//   "indexId": "<index ID>",
//   "timestamp": 1755686255764,
//   "level": "48.3499",
//   "levelHigh": "48.4283",
//   "levelLow": "47.4286",
//   "yearLevelHigh": "49.2585",
//   "yearLevelLow": "47.4286",
//   "lastClosingLevel": "49.0050",
//   "differencePercentage": "-1.34",
//   "differencePercentage4p": "-1.3368",
//   "differenceAbsolute": "-0.66"
// }
export interface ResponseSchema {
  indexId: string
  timestamp: number
  level: string
  levelHigh: string
  levelLow: string
  yearLevelHigh: string
  yearLevelLow: string
  lastClosingLevel: string
  differencePercentage: string
  differencePercentage4p: string
  differenceAbsolute: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const getPasswordFromEnvVar = (clientId: string): string => {
  const passwordEnvVar = `PASSWORD_${clientId.toUpperCase()}`
  const password = process.env[passwordEnvVar]
  if (!password) {
    throw new AdapterInputError({
      message: `Failed to get password from env var ${passwordEnvVar}`,
      statusCode: 400,
    })
  }
  return password
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: `/${param.clientId}/${param.isin}/performance`,
          auth: {
            username: param.clientId,
            password: getPasswordFromEnvVar(param.clientId),
          },
          params: param,
        },
      }
    })
  },
  parseResponse: (params, response) => {
    if (!response.data) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any value for clientID ${param.clientId} with ISIN ${param.isin}`,
            statusCode: 502,
          },
        }
      })
    }

    const result = Number(response.data.level)

    if (isNaN(result)) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: `The response for clientID ${param.clientId} with ISIN ${param.isin} was not a number`,
            statusCode: 502,
          },
        }
      })
    }

    return params.map((param) => {
      return {
        params: param,
        response: {
          result,
          data: {
            result,
          },
        },
      }
    })
  },
})
