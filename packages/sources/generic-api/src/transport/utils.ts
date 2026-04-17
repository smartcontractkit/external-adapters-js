import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import {
  TransportDependencies,
  TransportGenerics,
} from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import {
  AdapterResponse,
  PartialAdapterResponse,
  PartialSuccessfulResponse,
  sleep,
} from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import objectPath from 'object-path'
import { config, getApiConfig } from '../config'
import { BaseEndpointTypes as MultiHttpBaseEndpointTypes } from '../endpoint/multi-http'
import { sharedInputParameterConfig } from '../endpoint/shared'

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

type SharedRequestParams = TypeFromDefinition<typeof sharedInputParameterConfig>

export const prepareRequest = <T extends SharedRequestParams>(params: T) => {
  const apiConfig = getApiConfig(params.apiName)
  return {
    params: [params],
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
}

type Params<EndpointTypes extends TransportGenerics> = TypeFromDefinition<
  EndpointTypes['Parameters']
>

export type Response<EndpointTypes extends TransportGenerics> = PartialSuccessfulResponse<
  EndpointTypes['Response']
>

type MultiHttpParams = Params<MultiHttpBaseEndpointTypes>
type MultiHttpResponse = Response<MultiHttpBaseEndpointTypes>

const createMultiResponse = (
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
    timestamps: {
      providerIndicatedTimeUnixMs,
    },
  }
}

export const createResponse = <EndpointTypes extends TransportGenerics>({
  params,
  apiResponse,
  mapParam,
  mapResponse,
}: {
  params: Params<EndpointTypes>
  apiResponse: { data: object | undefined }
  mapParam: (param: Params<EndpointTypes>) => MultiHttpParams
  mapResponse: (response: MultiHttpResponse) => Response<EndpointTypes>
}): PartialAdapterResponse<EndpointTypes['Response']> => {
  try {
    return mapResponse(createMultiResponse(mapParam(params), apiResponse))
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const statusCode = error instanceof AdapterError ? error.statusCode : 502
    const extraFields = error instanceof AdapterErrorWithExtraFields ? error.extraFields : {}

    return {
      statusCode,
      errorMessage,
      ...extraFields,
    }
  }
}

type Logger = {
  error: (...args: unknown[]) => void
}

export class GenericApiTransport<
  EndpointTypes extends TransportGenerics & {
    Settings: typeof config.settings
  },
> extends SubscriptionTransport<EndpointTypes> {
  logger: Logger
  mapParam: (param: Params<EndpointTypes>) => MultiHttpParams
  mapResponse: (response: MultiHttpResponse) => Response<EndpointTypes>

  requester!: Requester

  constructor({
    logger,
    mapParam,
    mapResponse,
  }: {
    logger: Logger
    mapParam: (param: Params<EndpointTypes>) => MultiHttpParams
    mapResponse: (response: MultiHttpResponse) => Response<EndpointTypes>
  }) {
    super()
    this.logger = logger
    this.mapParam = mapParam
    this.mapResponse = mapResponse
  }

  async initialize(
    dependencies: TransportDependencies<EndpointTypes>,
    adapterSettings: EndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
  }

  async backgroundHandler(
    context: EndpointContext<EndpointTypes>,
    entries: Params<EndpointTypes>[],
  ) {
    await Promise.all(entries.map(async (param) => this.handleRequest(context, param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(context: EndpointContext<EndpointTypes>, param: Params<EndpointTypes>) {
    let response: AdapterResponse<EndpointTypes['Response']>
    try {
      response = await this._handleRequest(context, param)
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      this.logger.error(e, errorMessage)
      response = {
        statusCode: (e as AdapterInputError)?.statusCode || 502,
        errorMessage,
        timestamps: {
          providerDataRequestedUnixMs: 0,
          providerDataReceivedUnixMs: 0,
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }
    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  async _handleRequest(
    context: EndpointContext<EndpointTypes>,
    params: Params<EndpointTypes>,
  ): Promise<AdapterResponse<EndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()
    const requestConfig = prepareRequest(params as SharedRequestParams)
    const result = await this.requester.request<object>(
      calculateHttpRequestKey<EndpointTypes>({
        context,
        data: requestConfig.params,
        transportName: this.name,
      }),
      requestConfig.request,
    )
    const response = createResponse<EndpointTypes>({
      params,
      apiResponse: result.response,
      mapParam: this.mapParam,
      mapResponse: this.mapResponse,
    })
    return {
      ...response,
      statusCode: 'statusCode' in response ? response.statusCode : 200,
      timestamps: {
        providerIndicatedTimeUnixMs: undefined,
        ...('timestamps' in response ? response.timestamps : {}),
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
      },
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: EndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}
