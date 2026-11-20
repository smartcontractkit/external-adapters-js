import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import {
  HttpTransport,
  HttpTransportConfig,
  TransportDependencies,
} from '@chainlink/external-adapter-framework/transports'
import {
  makeLogger,
  ProviderResult,
  sleep,
  TimestampedProviderResult,
  validateResultNumber,
} from '@chainlink/external-adapter-framework/util'
import {
  AdapterDataProviderError,
  AdapterError,
} from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/ssa'
import { AuthManager } from './auth'

const logger = makeLogger('SsaTransport')

type RequestParams = typeof inputParameters.validated

// One record of the scores list, as the S&P API returns it.
export interface SsaScoreRecord {
  last_modified_date_time: string
  security_id: string
  ssa: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: SsaScoreRecord[]
  }
}

const providerError = (
  params: RequestParams,
  errorMessage: string,
): ProviderResult<HttpTransportTypes> => ({
  params,
  response: {
    statusCode: 502,
    errorMessage,
  },
})

interface RequesterTimestamps {
  providerDataRequestedUnixMs: number
  providerDataReceivedUnixMs: number
}

const withTimestamps = (
  result: ProviderResult<HttpTransportTypes>,
  timestamps: RequesterTimestamps,
): TimestampedProviderResult<HttpTransportTypes> => {
  if ('errorMessage' in result.response) {
    return {
      params: result.params,
      response: {
        ...result.response,
        timestamps: {
          ...timestamps,
          providerIndicatedTimeUnixMs: undefined,
        },
      },
    }
  }
  return {
    params: result.params,
    response: {
      ...result.response,
      timestamps: {
        ...timestamps,
        providerIndicatedTimeUnixMs: result.response.timestamps?.providerIndicatedTimeUnixMs,
      },
    },
  }
}

const parseResponse: HttpTransportConfig<HttpTransportTypes>['parseResponse'] = (
  params,
  response,
) => {
  const records = response.data

  return params.map((param) => {
    const { security_id: securityId } = param

    if (!Array.isArray(records)) {
      return providerError(param, 'The SSA reply is not a JSON array')
    }

    const record = records.find((item) => item.security_id === securityId)
    if (!record) {
      return providerError(param, `The SSA reply has no record for security_id ${securityId}`)
    }

    const validated = validateResultNumber(
      record.ssa,
      `The SSA score for security_id ${securityId} is not a number`,
    )
    if ('errorMessage' in validated) {
      return providerError(param, validated.errorMessage)
    }
    const result = validated.result

    if (!Number.isInteger(result) || result < 1 || result > 5) {
      return providerError(
        param,
        `The SSA score ${result} for security_id ${securityId} is outside the integer range 1-5`,
      )
    }

    if (typeof record.last_modified_date_time !== 'string') {
      return providerError(
        param,
        `The last_modified_date_time ${record.last_modified_date_time} for security_id ${securityId} is not a timestamp`,
      )
    }
    const providerIndicatedTimeUnixMs = new Date(record.last_modified_date_time).getTime()
    if (!Number.isFinite(providerIndicatedTimeUnixMs)) {
      return providerError(
        param,
        `The last_modified_date_time ${record.last_modified_date_time} for security_id ${securityId} is not a timestamp`,
      )
    }
    const recordTimeUnixS = Math.floor(providerIndicatedTimeUnixMs / 1000)

    return {
      params: param,
      response: {
        statusCode: 200,
        result,
        data: {
          result,
          exchangeRate: result,
          validFromTimestamp: recordTimeUnixS,
          observationsTimestamp: recordTimeUnixS,
        },
        timestamps: {
          providerIndicatedTimeUnixMs,
        },
      },
    }
  })
}

export class SsaHttpTransport extends HttpTransport<HttpTransportTypes> {
  private authManager!: AuthManager
  private bearerToken = ''
  private readonly transportConfig: HttpTransportConfig<HttpTransportTypes>

  constructor() {
    const transportConfig: HttpTransportConfig<HttpTransportTypes> = {
      prepareRequests: (params, settings) => ({
        params,
        request: {
          method: 'GET',
          baseURL: settings.API_ENDPOINT,
          url: '/api/v1/ssa/getAllScores',
          headers: {
            Authorization: `Bearer ${this.bearerToken}`,
            apikey: settings.SPGI_APIKEY,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      }),
      parseResponse,
    }
    super(transportConfig)
    this.transportConfig = transportConfig
  }

  override async initialize(
    dependencies: TransportDependencies<HttpTransportTypes>,
    adapterSettings: HttpTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.authManager = new AuthManager(this.requester, {
      AUTH_API_ENDPOINT: adapterSettings.AUTH_API_ENDPOINT,
      SPGI_CLIENT_ID: adapterSettings.SPGI_CLIENT_ID,
      BACKGROUND_EXECUTE_MS_HTTP: adapterSettings.BACKGROUND_EXECUTE_MS_HTTP,
    })
  }

  override async backgroundHandler(
    context: EndpointContext<HttpTransportTypes>,
    entries: RequestParams[],
  ): Promise<void> {
    if (!entries.length) {
      return super.backgroundHandler(context, entries)
    }

    try {
      this.bearerToken = await this.authManager.getBearerToken()
    } catch (e) {
      await this.responseCache.write(this.name, this.providerErrors(entries, e))
      await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS_HTTP)
      return
    }

    await this.fetchScores(context, entries)
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS_HTTP)
  }

  // One GET answers every entry of the batch. A provider failure is written per
  // entry as a 502 so the caller gets it before its cache poll ends; a throw
  // here would leave the entries without a provider response.
  private async fetchScores(
    context: EndpointContext<HttpTransportTypes>,
    entries: RequestParams[],
  ): Promise<void> {
    const prepared = this.transportConfig.prepareRequests(entries, context.adapterSettings)
    const requests = Array.isArray(prepared) ? prepared : [prepared]

    for (const request of requests) {
      const requestKey = calculateHttpRequestKey<HttpTransportTypes>({
        context: {
          ...context,
          endpointName: request.endpointNameOverride ?? context.endpointName,
        },
        data: request.params,
        transportName: this.name,
      })

      let results: TimestampedProviderResult<HttpTransportTypes>[]
      try {
        const { response, timestamps } = await this.requester.request<SsaScoreRecord[]>(
          requestKey,
          request.request,
        )
        results = this.transportConfig
          .parseResponse(request.params, response, context.adapterSettings)
          .map((result) => withTimestamps(result, timestamps))
      } catch (e) {
        results = this.providerErrors(entries, e)
      }

      await this.responseCache.write(this.name, results)
    }
  }

  private providerErrors(
    entries: RequestParams[],
    e: unknown,
  ): TimestampedProviderResult<HttpTransportTypes>[] {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
    logger.error(errorMessage)
    const statusCode = e instanceof AdapterError ? e.statusCode : 502
    // A provider failure carries the times of the failed call, as the
    // framework's own error path does; a login failure has no provider call.
    const timestamps =
      e instanceof AdapterDataProviderError
        ? e.timestamps
        : {
            providerDataRequestedUnixMs: 0,
            providerDataReceivedUnixMs: 0,
            providerIndicatedTimeUnixMs: undefined,
          }

    return entries.map((params) => ({
      params,
      response: {
        statusCode,
        errorMessage,
        timestamps,
      },
    }))
  }
}

export const httpTransport = new SsaHttpTransport()
