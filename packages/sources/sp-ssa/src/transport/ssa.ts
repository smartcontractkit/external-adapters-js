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
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { AuthManager } from './auth'
import {
  errorMessage,
  errorStatusCode,
  errorTimestamps,
  fetchScoresWithReauth,
  ProviderResponse,
  SsaAuthError,
  writeCooldownErrors,
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
  private generation = 0
  private authFailureUntil = 0
  private writeQueue: Promise<void> = Promise.resolve()

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
      TOKEN_ENDPOINT: adapterSettings.TOKEN_ENDPOINT,
      CLIENT_ID: adapterSettings.CLIENT_ID,
    })
    config.buildCensorList()
    await this.prefetchToken()
  }

  async backgroundHandler(
    context: EndpointContext<SsaTransportTypes>,
    entries: RequestParams[],
  ): Promise<void> {
    if (entries.length === 0) {
      return this.sleepUntilNextTick(context)
    }
    if (Date.now() < this.authFailureUntil) {
      await writeCooldownErrors(this.responseCache, this.name, entries)
      return this.sleepUntilNextTick(context)
    }

    const generation = ++this.generation
    try {
      const results = await this.fetchResults(entries)
      if (generation === this.generation) {
        await this.enqueueWrite(results, generation)
      }
    } catch (error) {
      if (generation !== this.generation) {
        return
      }
      await this.writeErrorResults(error, entries, generation)
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: SsaTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }

  private async prefetchToken(): Promise<void> {
    try {
      await this.authManager.getToken()
    } catch {
      // The first request retries the token mint and surfaces the auth error.
    }
    // The framework rebuilds the censor list after transport initialization, so
    // re-register the prefetched token once the adapter finishes starting.
    setImmediate(() => this.authManager.ensureCachedTokenCensored())
  }

  private sleepUntilNextTick(context: EndpointContext<SsaTransportTypes>): Promise<void> {
    return sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS_HTTP)
  }

  private async fetchResults(
    entries: RequestParams[],
  ): Promise<TimestampedProviderResult<SsaTransportTypes>[]> {
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
      throw new AdapterError({
        statusCode: 502,
        message: `The data provider returned status ${providerResponse.response.status}`,
      })
    }

    const records = parseProviderRecords(providerResponse.response.data)
    return entries.map((entry) => this.resultForEntry(entry, records, providerResponse.timestamps))
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

  private async writeErrorResults(
    error: unknown,
    entries: RequestParams[],
    generation: number,
  ): Promise<void> {
    if (error instanceof SsaAuthError) {
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
    await this.enqueueWrite(results, generation)
  }

  private enqueueWrite(
    results: TimestampedProviderResult<SsaTransportTypes>[],
    generation: number,
  ): Promise<void> {
    const write = this.writeQueue.then(async () => {
      if (generation !== this.generation) {
        return
      }
      await this.writeResults(results)
    })
    this.writeQueue = write.catch(() => undefined)
    return write
  }

  private async writeResults(
    results: TimestampedProviderResult<SsaTransportTypes>[],
  ): Promise<void> {
    const errorResults = results.filter((result) => result.response.errorMessage)
    if (errorResults.length > 0) {
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
