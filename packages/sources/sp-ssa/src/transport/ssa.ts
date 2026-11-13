import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import {
  makeLogger,
  sleep,
  TimestampedProviderResult,
} from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/ssa'
import { AuthManager } from './auth'
import { config } from '../config'
import {
  errorMessage,
  errorTimestamps,
  fetchScoresWithReauth,
  SsaAuthError,
  writeCooldownErrors,
} from './request'
import { parseProviderRecords, parseScore, parseTimestamp, selectRecord } from './utils'

const logger = makeLogger('SsaTransport')

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
    try {
      await this.authManager.getToken()
    } catch {
      // The first request will retry the token mint and surface the auth error.
    }
    // The framework rebuilds the censor list after transport initialization, so
    // re-register the prefetched token once the adapter finishes starting.
    setImmediate(() => this.authManager.ensureCachedTokenCensored())
  }

  async backgroundHandler(
    context: EndpointContext<SsaTransportTypes>,
    entries: RequestParams[],
  ): Promise<void> {
    if (Date.now() < this.authFailureUntil) {
      if (await writeCooldownErrors(this.responseCache, this.name, entries)) {
        return
      }
      await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS_HTTP)
      return
    }
    if (entries.length === 0) {
      await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS_HTTP)
      return
    }
    const generation = ++this.generation

    try {
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
      if (generation !== this.generation) {
        return
      }
      const results = entries.map((entry): TimestampedProviderResult<SsaTransportTypes> => {
        try {
          const record = selectRecord(records, entry.security_id)
          const result = parseScore(record.ssa)
          const providerIndicatedTimeUnixMs = parseTimestamp(record.last_modified_date_time)
          return {
            params: entry,
            response: {
              result,
              data: { result },
              timestamps: {
                ...providerResponse.timestamps,
                providerIndicatedTimeUnixMs,
              },
            },
          }
        } catch (e) {
          return {
            params: entry,
            response: {
              statusCode: 502,
              errorMessage: `The data provider returned invalid data for security_id ${
                entry.security_id
              }: ${e instanceof Error ? e.message : 'unknown error'}`,
              timestamps: {
                ...providerResponse.timestamps,
                providerIndicatedTimeUnixMs: undefined,
              },
            },
          }
        }
      })
      if (results.length > 0) {
        await this.writeResults(results)
      }
    } catch (e) {
      if (generation !== this.generation) {
        return
      }
      if (e instanceof SsaAuthError) {
        this.authFailureUntil = Date.now() + SsaTransport.AUTH_FAILURE_COOLDOWN_MS
      }
      const message = errorMessage(e)
      logger.error(message)
      const timestamps = errorTimestamps(e)
      const results: TimestampedProviderResult<SsaTransportTypes>[] = entries.map((entry) => ({
        params: entry,
        response: {
          statusCode: (e as AdapterError)?.statusCode || 502,
          errorMessage: message,
          timestamps,
        },
      }))
      await this.writeResults(results)
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: SsaTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
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
