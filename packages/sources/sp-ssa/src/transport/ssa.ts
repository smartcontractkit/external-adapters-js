import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import {
  makeLogger,
  SingleNumberResultResponse,
  sleep,
  TimestampedProviderResult,
} from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import {
  AdapterConnectionError,
  AdapterDataProviderError,
  AdapterError,
  AdapterRateLimitError,
} from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { AuthManager } from './auth'
import {
  errorMessage,
  errorStatusCode,
  errorTimestamps,
  fetchScoresWithReauth,
  isCredentialFailure,
  ProviderResponse,
  SsaProviderDataError,
} from './request'
import { parseProviderRecords, parseScore, parseTimestamp, selectRecord } from './utils'

const logger = makeLogger('SsaTransport')

export const inputParameters = new InputParameters(
  {
    security_id: {
      description: 'The S&P security identifier to report, for example SP-EURC',
      type: 'string',
      required: true,
    },
  },
  [
    {
      security_id: 'SP-EURC',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

type RequestParams = typeof inputParameters.validated

export type SsaTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: unknown
  }
}

export class SsaTransport extends SubscriptionTransport<SsaTransportTypes> {
  private static readonly AUTH_FAILURE_COOLDOWN_MS = 60_000

  requester!: Requester
  settings!: SsaTransportTypes['Settings']
  endpointName!: string
  authManager!: AuthManager
  private authFailureUntil = 0

  override async initialize(
    dependencies: TransportDependencies<SsaTransportTypes>,
    adapterSettings: SsaTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.settings = adapterSettings
    this.endpointName = endpointName
    this.authManager = new AuthManager(this.requester, {
      TOKEN_ENDPOINT: adapterSettings.AUTH_ENDPOINT,
      CLIENT_ID: adapterSettings.CLIENT_ID,
      ORIGIN: adapterSettings.ORIGIN,
    })
  }

  async backgroundHandler(
    context: EndpointContext<SsaTransportTypes>,
    entries: RequestParams[],
  ): Promise<void> {
    if (entries.length === 0) {
      await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS_HTTP)
      return
    }
    if (Date.now() < this.authFailureUntil) {
      await this.writeErrorResults(
        new AdapterError({
          statusCode: 502,
          message: 'The data provider rejected the credentials; retrying after a cooldown',
        }),
        entries,
      )
      await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS_HTTP)
      return
    }

    try {
      const results = await this.fetchResults(entries)
      await this.writeResults(results)
    } catch (error) {
      await this.writeErrorResults(error, entries)
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: SsaTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }

  private async fetchResults(
    entries: RequestParams[],
  ): Promise<TimestampedProviderResult<SsaTransportTypes>[]> {
    // The request key is built from the whole subscription set, so the
    // Requester coalesces one provider call for every entry in this batch.
    const sortedEntries = [...entries].sort((a, b) => a.security_id.localeCompare(b.security_id))
    const requestKey = calculateHttpRequestKey<SsaTransportTypes>({
      context: {
        adapterSettings: this.settings,
        inputParameters,
        endpointName: this.endpointName,
      },
      data: sortedEntries,
      transportName: this.name,
    })
    const providerResponse = await fetchScoresWithReauth(
      this.requester,
      this.settings,
      this.authManager,
      requestKey,
    )
    if (providerResponse.response.status !== 200) {
      throw new AdapterDataProviderError(
        {
          statusCode: 502,
          message: `The data provider returned status ${providerResponse.response.status}`,
          providerStatusCode: providerResponse.response.status,
        },
        {
          ...providerResponse.timestamps,
          providerIndicatedTimeUnixMs: undefined,
        },
      )
    }

    const records = this.parseRecords(providerResponse)
    return entries.map((entry) => this.resultForEntry(entry, records, providerResponse.timestamps))
  }

  private parseRecords(
    providerResponse: ProviderResponse,
  ): ReturnType<typeof parseProviderRecords> {
    try {
      return parseProviderRecords(providerResponse.response.data)
    } catch (error) {
      if (error instanceof AdapterError) {
        throw new SsaProviderDataError(error.message, {
          ...providerResponse.timestamps,
          providerIndicatedTimeUnixMs: undefined,
        })
      }
      throw error
    }
  }

  private resultForEntry(
    entry: RequestParams,
    records: ReturnType<typeof parseProviderRecords>,
    timestamps: ProviderResponse['timestamps'],
  ): TimestampedProviderResult<SsaTransportTypes> {
    try {
      const record = selectRecord(records, entry.security_id)
      const result = parseScore(record.ssa)
      return {
        params: entry,
        response: {
          result,
          data: { result },
          timestamps: {
            ...timestamps,
            providerIndicatedTimeUnixMs: parseTimestamp(record.last_modified_date_time),
          },
        },
      }
    } catch (error) {
      return {
        params: entry,
        response: {
          statusCode: 502,
          errorMessage: `The data provider returned invalid data for security_id ${
            entry.security_id
          }: ${errorMessage(error)}`,
          timestamps: {
            ...timestamps,
            providerIndicatedTimeUnixMs: undefined,
          },
        },
      }
    }
  }

  private async writeErrorResults(error: unknown, entries: RequestParams[]): Promise<void> {
    if (isCredentialFailure(error)) {
      this.authFailureUntil = Date.now() + SsaTransport.AUTH_FAILURE_COOLDOWN_MS
    }
    const message = errorMessage(error)
    logger.error(message)
    const timestamps = errorTimestamps(error)
    const statusCode = errorStatusCode(error)
    const results: TimestampedProviderResult<SsaTransportTypes>[] = entries.map((params) => ({
      params,
      response: {
        statusCode,
        errorMessage: message,
        timestamps,
      },
    }))
    const keepCachedSuccess =
      error instanceof AdapterConnectionError || error instanceof AdapterRateLimitError
    await this.writeResults(results, !keepCachedSuccess)
  }

  private async writeResults(
    results: TimestampedProviderResult<SsaTransportTypes>[],
    replaceCachedSuccess = true,
  ): Promise<void> {
    // The local cache will not replace a live success with an error. Delete
    // the success first so a provider error is published as an error, as the
    // stream requires, instead of leaving the stale value in place.
    const errorResults = results.filter((result) => result.response.errorMessage)
    if (replaceCachedSuccess && errorResults.length > 0) {
      await Promise.all(
        errorResults.map((result) =>
          this.responseCache.cache.delete(this.responseCache.getCacheKey(this.name, result.params)),
        ),
      )
    }
    await this.responseCache.write(this.name, results)
  }
}

export const ssaTransport = new SsaTransport()
