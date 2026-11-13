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
import { errorMessage, errorTimestamps } from './errors'
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
  private readonly latestProviderTimeMs = new Map<string, number>()

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
  }

  async backgroundHandler(
    context: EndpointContext<SsaTransportTypes>,
    entries: RequestParams[],
  ): Promise<void> {
    if (Date.now() < this.authFailureUntil) {
      await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS_HTTP)
      return
    }
    if (entries.length === 0) {
      await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS_HTTP)
      return
    }
    const generation = ++this.generation

    try {
      const token = await this.authManager.getToken()
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
      const providerResponse = await this.requester.request<unknown>(requestKey, {
        method: 'GET',
        baseURL: this.settings.API_ENDPOINT,
        url: '/api/v1/ssa/getAllScores',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: this.settings.API_KEY,
        },
      })

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
      const results = entries
        .map((entry): TimestampedProviderResult<SsaTransportTypes> | undefined => {
          try {
            const record = selectRecord(records, entry.security_id)
            const result = parseScore(record.ssa)
            const providerIndicatedTimeUnixMs = parseTimestamp(record.last_modified_date_time)
            const previousTime = this.latestProviderTimeMs.get(entry.security_id)
            if (previousTime !== undefined && providerIndicatedTimeUnixMs < previousTime) {
              return undefined
            }
            this.latestProviderTimeMs.set(entry.security_id, providerIndicatedTimeUnixMs)
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
        .filter((result): result is TimestampedProviderResult<SsaTransportTypes> => !!result)
      if (results.length > 0) {
        await this.writeResults(results)
      }
    } catch (e) {
      const adapterError = e as AdapterError
      if (adapterError?.providerStatusCode === 401) {
        this.authManager.invalidate()
        this.authFailureUntil = Date.now() + SsaTransport.AUTH_FAILURE_COOLDOWN_MS
      }
      if (generation !== this.generation) {
        return
      }
      const message = errorMessage(e)
      logger.error(message)
      const timestamps = errorTimestamps(e)
      const results: TimestampedProviderResult<SsaTransportTypes>[] = entries.map((entry) => ({
        params: entry,
        response: {
          statusCode: adapterError?.statusCode || 502,
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
