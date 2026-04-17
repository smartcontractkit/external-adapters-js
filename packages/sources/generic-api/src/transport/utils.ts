import { TransportGenerics } from '@chainlink/external-adapter-framework/transports'
import {
  //ProviderResult,
  AdapterResponse,
  PartialSuccessfulResponse,
  ResponseTimestamps,
} from '@chainlink/external-adapter-framework/util'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import objectPath from 'object-path'
import { getApiConfig } from '../config'
import { BaseEndpointTypes as MultiHttpBaseEndpointTypes } from '../endpoint/multi-http'

type ResponseField = string | number | boolean | undefined

class AdapterErrorWithExtraFields extends AdapterError {
  readonly extraFields: { [key: string]: ResponseField }

  constructor({
    message,
    statusCode,
    extraFields,
  }: {
    message: string
    statusCode: number
    extraFields: { [key: string]: ResponseField }
  }) {
    super({ message, statusCode })
    this.extraFields = extraFields
  }
}

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

export type NonStreamTimestamps = ResponseTimestamps & {
  providerDataStreamEstablishedUnixMs?: never
}

type Params<EndpointTypes extends TransportGenerics> = TypeFromDefinition<
  EndpointTypes['Parameters']
>
export type Response<EndpointTypes extends TransportGenerics> = PartialSuccessfulResponse<
  EndpointTypes['Response']
> & {
  timestamps: NonStreamTimestamps
  statusCode: number
}

type MultiHttpParams = Params<MultiHttpBaseEndpointTypes>
type MultiHttpResponse = Response<MultiHttpBaseEndpointTypes>

const createResponse = (
  param: MultiHttpParams,
  response: { data: object | undefined },
): MultiHttpResponse => {
  if (!response.data) {
    throw new AdapterError({
      message: `The data provider for ${param.apiName} didn't return any value`,
      statusCode: 502,
    })
  }

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
    throw new AdapterErrorWithExtraFields({
      message: errorMessage,
      statusCode: 503,
      extraFields: {
        ripcord: true,
        ripcordAsInt: 1, // 1 = paused state
        ripcordDetails,
      },
    })
  }

  // Extract all dataPaths
  const data: { [key: string]: number | string | boolean } = {}

  for (const { name, path } of param.dataPaths) {
    if (!objectPath.has(response.data, path)) {
      throw new AdapterError({
        message: `Data path '${path}' not found in response for '${param.apiName}'`,
        statusCode: 500,
      })
    }
    const value = objectPath.get(response.data, path)
    data[name] = value as number | string
  }

  // Extract timestamp if providerIndicatedTimePath is provided
  let providerIndicatedTimeUnixMs: number | undefined
  if (param.providerIndicatedTimePath !== undefined) {
    if (!objectPath.has(response.data, param.providerIndicatedTimePath)) {
      throw new AdapterError({
        message: `Provider indicated time path '${param.providerIndicatedTimePath}' not found in response for '${param.apiName}'`,
        statusCode: 500,
      })
    }
    const timestampValue = objectPath.get(response.data, param.providerIndicatedTimePath)
    providerIndicatedTimeUnixMs = new Date(timestampValue).getTime()

    // Validate: must be finite and positive
    if (!Number.isFinite(providerIndicatedTimeUnixMs) || providerIndicatedTimeUnixMs <= 0) {
      throw new AdapterError({
        message: `Invalid timestamp value at '${param.providerIndicatedTimePath}' for '${param.apiName}'`,
        statusCode: 500,
      })
    }
  }

  // Extract primary result from data
  const result = (data['result'] as number | string) ?? null

  if (param.ripcordPath !== undefined) {
    data.ripcord = false
    data.ripcordAsInt = 0 // normal state
  }

  return {
    result,
    data,
    statusCode: 200,
    timestamps: {
      providerIndicatedTimeUnixMs,
      providerDataReceivedUnixMs: 0, // TODO
      providerDataRequestedUnixMs: 0, // TODO
    },
  }
}

type NonStreamAdapterResponse<EndpointTypes extends TransportGenerics> = AdapterResponse<
  EndpointTypes['Response']
> & {
  timestamps: NonStreamTimestamps
}

export const createResponses = <EndpointTypes extends TransportGenerics>({
  params,
  apiResponse,
  mapParam,
  mapResponse,
}: {
  params: Params<EndpointTypes>
  apiResponse: { data: object | undefined }
  mapParam: (param: Params<EndpointTypes>) => MultiHttpParams
  mapResponse: (response: MultiHttpResponse) => Response<EndpointTypes>
}): NonStreamAdapterResponse<EndpointTypes> => {
  try {
    return mapResponse(createResponse(mapParam(params), apiResponse))
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const statusCode = error instanceof AdapterError ? error.statusCode : 502
    const extraFields = error instanceof AdapterErrorWithExtraFields ? error.extraFields : {}

    return {
      statusCode,
      errorMessage,
      ...extraFields,
      timestamps: {
        providerDataRequestedUnixMs: 0,
        providerDataReceivedUnixMs: 0,
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }
}
