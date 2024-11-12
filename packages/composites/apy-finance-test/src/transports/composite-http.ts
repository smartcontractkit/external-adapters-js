import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import {
  TransportDependencies,
  TransportGenerics,
} from '@chainlink/external-adapter-framework/transports'
import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import {
  TimestampedProviderResult,
  censorLogs,
  makeLogger,
  sleep,
} from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterDataProviderError,
  AdapterRateLimitError,
} from '@chainlink/external-adapter-framework/validation/error'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'

const logger = makeLogger('CompositeHttpTransport')

export interface CompositeHttpTransportConfig<T extends TransportGenerics> {
  /**
   * This method should take the valid input parameters for a request, and make the data provider requests neccessary
   * to return the information.
   *
   *
   * @param params - valid input paramters sent to this Adapter
   * @param adapterSettings - the config for this Adapter
   * @param requestHandler - Function to make requests via Requester, enforcing rate limiting
   * @returns Promise that returns the timestamped result
   */
  performRequest: (
    params: TypeFromDefinition<T['Parameters']>,
    adapterSettings: T['Settings'],
    requestHandler: <R>(requestConfig: AxiosRequestConfig) => Promise<AxiosResponse<R>>,
  ) => Promise<TimestampedProviderResult<T>>
}

/**
 * Transport implementation that takes incoming batches of requests and keeps a warm cache of values.
 * Within the setup function, adapter params are added to a set that also keeps track and expires values.
 * In the background execute, the list of non-expired items in the set is fetched.
 * The list is then passed through to the `performRequest` function, that returns a Provider result.
 * This result is then set in the Cache so the adapter can fetch values from there.
 */
export class CompositeHttpTransport<T extends TransportGenerics> extends SubscriptionTransport<T> {
  // Flag used to track whether the warmer has moved from having no entries to having some and vice versa
  // Used for recording the cache warmer active metrics accurately
  WARMER_ACTIVE = false
  requester!: Requester

  constructor(private config: CompositeHttpTransportConfig<T>) {
    super()
  }

  override async initialize(
    dependencies: TransportDependencies<T>,
    adapterSettings: T['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
  }

  getSubscriptionTtlFromConfig(adapterSettings: T['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }

  async backgroundHandler(
    context: EndpointContext<T>,
    entries: TypeFromDefinition<T['Parameters']>[],
  ): Promise<void> {
    if (!entries.length) {
      logger.debug(
        `No entries in subscription set, sleeping for ${context.adapterSettings.BACKGROUND_EXECUTE_MS_HTTP}ms...`,
      )
      if (this.WARMER_ACTIVE) {
        // Decrement count when warmer changed from having entries to having none
        metrics.get('cacheWarmerCount').labels({ isBatched: 'true' }).dec()
        this.WARMER_ACTIVE = false
      }
      await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS_HTTP)
      return
    } else if (this.WARMER_ACTIVE === false) {
      // Increment count when warmer changed from having no entries to having some
      metrics.get('cacheWarmerCount').labels({ isBatched: 'true' }).inc()
      this.WARMER_ACTIVE = true
    }

    // We're awaiting these promises because although we have request coalescing, new entries
    // could be added to the subscription set if not blocking this operation, so the next time the
    // background execute is triggered if the request is for a fully batched endpoint, we could end up
    // with the full combination of possible params within the request queue
    logger.trace(`Handling ${entries.length} entries...`)
    const start = Date.now()
    await Promise.all(entries.map((e) => this.handleRequest(e, context)))
    const duration = Date.now() - start
    logger.trace(`All requests in the background execute were completed`)

    // These logs will surface warnings that operators should take action on, in case the execution of all
    // requests is taking too long so that entries could have expired within this timeframe
    if (duration > context.adapterSettings.WARMUP_SUBSCRIPTION_TTL) {
      logger.warn(
        `Background execution of all HTTP requests in a batch took ${duration},\
         which is longer than the subscription TTL (${context.adapterSettings.WARMUP_SUBSCRIPTION_TTL}).\
         This might be due to insufficient speed on the selected API tier, please check metrics and logs to confirm and consider moving to a faster tier.`,
      )
    }
    if (duration > context.adapterSettings.CACHE_MAX_AGE) {
      logger.warn(
        `Background execution of all HTTP requests in a batch took ${duration},\
         which is longer than the max cache age (${context.adapterSettings.CACHE_MAX_AGE}).\
         This might be due to insufficient speed on the selected API tier, please check metrics and logs to confirm and consider moving to a faster tier.`,
      )
    }

    // We're not sleeping here on purpose. We sleep when there are no entries in the subscription set to avoid polling too
    // frequently, but if we have entries we want the background execute to be re-run ASAP so we can prepare the next batch
    // of requests, and the sleep to rate-limit will be performed by the rate-limiter in the Requester.
    return
  }

  private async handleRequest(
    params: TypeFromDefinition<T['Parameters']>,
    context: EndpointContext<T>,
  ): Promise<void> {
    const { result, msUntilNextExecution } = await this.makeRequest(params, context)

    logger.debug('Setting adapter responses in cache')
    await this.responseCache.write(this.name, [result])

    if (msUntilNextExecution) {
      // If we got this, it means that the queue was unable to accomomdate this request.
      // We want to sleep here for a bit, to avoid running into constant queue overflow replacements in competing threads.
      logger.info(
        `Request queue has overflowed, sleeping for ${msUntilNextExecution}ms until reprocessing...`,
      )
      await sleep(msUntilNextExecution)
    }
  }

  private async makeRequest(
    params: TypeFromDefinition<T['Parameters']>,
    context: EndpointContext<T>,
  ): Promise<{
    result: TimestampedProviderResult<T>
    msUntilNextExecution?: number
  }> {
    const requestHandler = async <R>(
      requestConfig: AxiosRequestConfig,
    ): Promise<AxiosResponse<R>> => {
      const key = calculateHttpRequestKey({
        context: context,
        data: { ...(requestConfig.params || {}), ...(requestConfig.data || {}) },
        transportName: this.name,
      })

      const { response } = await this.requester.request<R>(key, requestConfig)
      return response
    }

    try {
      const result = await this.config.performRequest(
        params,
        context.adapterSettings,
        requestHandler,
      )
      return { result }
    } catch (e) {
      if (e instanceof AdapterDataProviderError) {
        const err = e as AdapterDataProviderError

        const errorMessage =
          err.cause instanceof AxiosError && err.cause.status
            ? `Data Provider request failed with status ${err.cause.status}: "${JSON.stringify(
                err.cause.response?.data,
              )}"`
            : `Data Provider request failed with error: ${err.cause}`

        censorLogs(() => logger.info(errorMessage))
        return {
          result: {
            params: params,
            response: {
              errorMessage,
              statusCode: 502,
              timestamps: err.timestamps,
            },
          },
        }
      } else if (e instanceof AdapterRateLimitError) {
        const err = e as AdapterRateLimitError
        censorLogs(() => logger.info(err.message))
        return {
          result: {
            params: params,
            response: {
              errorMessage: err.message,
              statusCode: 429,
              timestamps: {
                providerDataRequestedUnixMs: 0,
                providerDataReceivedUnixMs: 0,
                providerIndicatedTimeUnixMs: undefined,
              },
            },
          },
          msUntilNextExecution: err.msUntilNextExecution,
        }
      } else {
        censorLogs(() => logger.error(e))
        return {
          result: {
            params,
            response: {
              errorMessage: 'Unknown error',
              statusCode: 500,
              timestamps: {
                providerDataRequestedUnixMs: 0,
                providerDataReceivedUnixMs: 0,
                providerIndicatedTimeUnixMs: undefined,
              },
            },
          },
        }
      }
    }
  }
}
