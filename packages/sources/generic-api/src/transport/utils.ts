import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import objectPath from 'object-path'
import { getApiConfig } from '../config'
import { BaseEndpointTypes as MultiHttpBaseEndpointTypes } from '../endpoint/multi-http'

export const prepareRequests = <T extends { apiName: string }>(params: T[]) => {
  return params.map((param) => {
    const apiConfig = getApiConfig(param.apiName)
    return {
      params: [param],
      request: {
        baseURL: apiConfig.url,
        ...(apiConfig.authHeader
          ? {
              headers: {
                [apiConfig.authHeader]: apiConfig.authHeaderValue,
              },
            }
          : {}),
      },
    }
  })
}

export const createResponse = (
  param: {
    apiName: string
    dataPaths: { name: string; path: string }[]
    ripcordPath?: string
    ripcordDisabledValue: string
    providerIndicatedTimePath?: string
  },
  response: { data: object },
): ProviderResult<MultiHttpBaseEndpointTypes> => {
  // Check ripcord
  if (
    param.ripcordPath !== undefined &&
    objectPath.has(response.data, param.ripcordPath) &&
    objectPath.get(response.data, param.ripcordPath).toString() !== param.ripcordDisabledValue
  ) {
    // Look for ripcordDetails as sibling field
    const ripcordDetailsPath = `${param.ripcordPath}Details`
    let ripcordDetails: string | undefined
    if (objectPath.has(response.data, ripcordDetailsPath)) {
      const details = objectPath.get(response.data, ripcordDetailsPath)
      if (Array.isArray(details) && details.length > 0) {
        ripcordDetails = details.join(', ')
      }
    }

    const errorMessage = ripcordDetails
      ? `Ripcord activated for '${param.apiName}'. Details: ${ripcordDetails}`
      : `Ripcord activated for '${param.apiName}'`
    // We assign to an intermediate varaible to have slightly looser type
    // checking, allowing the extra ripcord fields which the return type
    // doesn't specify.
    const result = {
      params: param,
      response: {
        errorMessage,
        ripcord: true,
        ripcordAsInt: 1, // 1 = paused state
        ripcordDetails,
        statusCode: 503,
      },
    }
    return result
  }

  // Extract all dataPaths
  const data: { [key: string]: number | string | boolean } = {}

  for (const { name, path } of param.dataPaths) {
    if (!objectPath.has(response.data, path)) {
      return {
        params: param,
        response: {
          errorMessage: `Data path '${path}' not found in response for '${param.apiName}'`,
          statusCode: 500,
        },
      }
    }
    const value = objectPath.get(response.data, path)
    data[name] = value as number | string
  }

  // Extract timestamp if providerIndicatedTimePath is provided
  let providerIndicatedTimeUnixMs: number | undefined
  if (param.providerIndicatedTimePath !== undefined) {
    if (!objectPath.has(response.data, param.providerIndicatedTimePath)) {
      return {
        params: param,
        response: {
          errorMessage: `Provider indicated time path '${param.providerIndicatedTimePath}' not found in response for '${param.apiName}'`,
          statusCode: 500,
        },
      }
    }
    const timestampValue = objectPath.get(response.data, param.providerIndicatedTimePath)
    providerIndicatedTimeUnixMs = new Date(timestampValue).getTime()

    // Validate: must be finite and positive
    if (!Number.isFinite(providerIndicatedTimeUnixMs) || providerIndicatedTimeUnixMs <= 0) {
      return {
        params: param,
        response: {
          errorMessage: `Invalid timestamp value at '${param.providerIndicatedTimePath}' for '${param.apiName}'`,
          statusCode: 500,
        },
      }
    }
  }

  // Extract primary result from data
  const result = (data['result'] as number | string) ?? null

  if (param.ripcordPath !== undefined) {
    data.ripcord = false
    data.ripcordAsInt = 0 // normal state
  }

  return {
    params: param,
    response: {
      result,
      data,
      timestamps: {
        providerIndicatedTimeUnixMs,
      },
    },
  }
}
