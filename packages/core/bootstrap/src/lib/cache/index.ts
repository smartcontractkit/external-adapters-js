import { AdapterContext, AdapterRequest, AdapterResponse, Middleware } from '@chainlink/types'
import { logger } from '../external-adapter'
import { Store } from 'redux'
import { reducer } from '../burst-limit'
import { withBurstLimit } from '../burst-limit'
import {
  delay,
  exponentialBackOffMs,
  getHashOpts,
  getWithCoalescing,
  parseBool,
  uuid,
  hash,
} from '../util'
import { getMaxAgeOverride, getTTL } from './ttl'
import * as local from './local'
import { LocalOptions } from './local'
import * as metrics from './metrics'
import * as redis from './redis'
import { CacheEntry } from './types'

const env = process.env

export const DEFAULT_CACHE_ENABLED = true
const DEFAULT_CACHE_TYPE = 'local'
const DEFAULT_CACHE_KEY_GROUP = uuid()
// Request coalescing
const DEFAULT_RC_INTERVAL = 100
const DEFAULT_RC_INTERVAL_MAX = 1000
const DEFAULT_RC_INTERVAL_COEFFICIENT = 2
const DEFAULT_RC_ENTROPY_MAX = 0
const DEFAULT_RC_MAX_RETRIES = 5

export const MINIMUM_AGE = 1000 * 60 * 0.5 // 30 seconds

export type Cache = redis.RedisCache | local.LocalLRUCache

export interface CacheOptions {
  instance?: Cache
  enabled: boolean
  cacheImplOptions: local.LocalOptions | redis.RedisOptions
  cacheBuilder: (options: CacheImplOptions) => Promise<redis.RedisCache | local.LocalLRUCache>
  key: {
    group: string
  }
  requestCoalescing: {
    enabled: boolean
    interval: number
    intervalMax: number
    intervalCoefficient: number
    entropyMax: number
    maxRetries: number
  }
  minimumAge: number
}

export const defaultOptions = (): CacheOptions => {
  return {
    enabled: parseBool(env.CACHE_ENABLED ?? DEFAULT_CACHE_ENABLED),
    cacheImplOptions: defaultCacheImplOptions(),
    cacheBuilder: defaultCacheBuilder(),
    key: {
      group: env.CACHE_KEY_GROUP || DEFAULT_CACHE_KEY_GROUP,
    },
    // Request coalescing
    requestCoalescing: {
      enabled: parseBool(env.REQUEST_COALESCING_ENABLED),
      // Capped linear back-off: 100, 200, 400, 800, 1000..
      interval: Number(env.REQUEST_COALESCING_INTERVAL) || DEFAULT_RC_INTERVAL,
      intervalMax: Number(env.REQUEST_COALESCING_INTERVAL_MAX) || DEFAULT_RC_INTERVAL_MAX,
      intervalCoefficient:
        Number(env.REQUEST_COALESCING_INTERVAL_COEFFICIENT) || DEFAULT_RC_INTERVAL_COEFFICIENT,
      // Add entropy to absorb bursts
      entropyMax: Number(env.REQUEST_COALESCING_ENTROPY_MAX) || DEFAULT_RC_ENTROPY_MAX,
      maxRetries: Number(env.REQUEST_COALESCING_MAX_RETRIES) || DEFAULT_RC_MAX_RETRIES,
    },
    minimumAge: Number(env.CACHE_MIN_AGE) || MINIMUM_AGE,
  }
}

export type CacheImplOptions = LocalOptions | redis.RedisOptions
const defaultCacheImplOptions = (): CacheImplOptions => {
  const type = env.CACHE_TYPE || DEFAULT_CACHE_TYPE
  const options = type === 'redis' ? redis.defaultOptions() : local.defaultOptions()
  return options
}

const defaultCacheBuilder = () => {
  return async (options: CacheImplOptions) => {
    switch (options.type) {
      case 'redis': {
        return await redis.RedisCache.build(options as redis.RedisOptions)
      }

      default: {
        return await Promise.resolve(new local.LocalLRUCache(options))
      }
    }
  }
}

// Options without sensitive data
export const redactOptions = (options: CacheOptions): CacheOptions => ({
  ...options,
  cacheImplOptions:
    options.cacheImplOptions.type === 'redis'
      ? redis.redactOptions(options.cacheImplOptions as redis.RedisOptions)
      : local.redactOptions(options.cacheImplOptions),
})

export class AdapterCache {
  private readonly options: CacheOptions
  private cache: Cache
  private hashOptions = getHashOpts()

  constructor(context: AdapterContext) {
    if (!context?.cache?.instance) throw Error(`cache not initiated`)

    const {
      cache: options,
      cache: { instance: cache },
    } = context
    this.options = options
    this.cache = cache
  }

  public getKey(data: AdapterRequest): string {
    return `${this.options.key.group}:${hash(data, this.hashOptions)}`
  }

  public getCoalescingKey(key: string): string {
    return `inFlight:${key}`
  }

  public async setInFlightMarker(key: string, maxAge: number): Promise<void> {
    if (!this.options.requestCoalescing.enabled) return
    await this.cache.setFlightMarker(key, maxAge)
    logger.debug(`Request coalescing: SET ${key}`)
  }

  public async delInFlightMarker(key: string): Promise<void> {
    if (!this.options.requestCoalescing.enabled) return
    await this.cache.del(key)
    logger.debug(`Request coalescing: DEL ${key}`)
  }

  public getWithCoalescing(key: string): Promise<undefined | CacheEntry> {
    return getWithCoalescing({
      get: async (retryCount: number) => {
        const entry = await this.cache.getResponse(key)
        if (entry) logger.debug(`Request coalescing: GET on retry #${retryCount}`)
        return entry
      },
      isInFlight: async (retryCount: number) => {
        if (retryCount === 1 && this.options.requestCoalescing.entropyMax) {
          // Add some entropy here because of possible scenario where the key won't be set before multiple
          // other instances in a burst request try to access the coalescing key.
          const randomMs = Math.random() * this.options.requestCoalescing.entropyMax
          await delay(randomMs)
        }
        const inFlight = await this.cache.getFlightMarker(this.getCoalescingKey(key))
        logger.debug(`Request coalescing: CHECK inFlight:${inFlight} on retry #${retryCount}`)
        return inFlight
      },
      retries: this.options.requestCoalescing.maxRetries,
      interval: (retryCount: number) =>
        exponentialBackOffMs(
          retryCount,
          this.options.requestCoalescing.interval,
          this.options.requestCoalescing.intervalMax,
          this.options.requestCoalescing.intervalCoefficient,
        ),
    })
  }

  public async getResultForRequest(
    adapterRequest: AdapterRequest,
  ): Promise<AdapterResponse | undefined> {
    const key = this.getKey(adapterRequest)
    const observe = metrics.beginObserveCacheMetrics({
      isFromWs: !!adapterRequest.debug?.ws,
      participantId: key,
      feedId: adapterRequest.metricsMeta?.feedId || 'N/A',
    })

    const cachedAdapterResponse = this.options.requestCoalescing.enabled
      ? await this.getWithCoalescing(key)
      : await this.cache.getResponse(key)

    if (cachedAdapterResponse) {
      const maxAgeOverride = getMaxAgeOverride(adapterRequest)
      if (adapterRequest?.debug?.warmer) logger.trace(`Cache: SKIP(Cache Warmer middleware)`)
      else if (adapterRequest?.debug?.ws) logger.trace(`Cache: SKIP(Websockets middleware)`)
      else if (maxAgeOverride && maxAgeOverride < 0) logger.trace(`Cache: SKIP(maxAge < 0)`)
      else {
        logger.trace(`Cache: GET ${key}`, cachedAdapterResponse)
        const ttl = await this.cache.ttl(key)
        // TODO: isnt this a bug? cachedAdapterResponse.maxAge will be different
        // if the above conditional gets executed!
        const staleness = (cachedAdapterResponse.maxAge - ttl) / 1000
        const debug = {
          ...cachedAdapterResponse?.debug,
          cacheHit: true,
          staleness,
          performance: observe.stalenessAndExecutionTime(true, staleness),
          providerCost: 0,
        }

        // we should be smarter about this in the future
        // and allow path configuration if result is not a number or string
        observe.cacheGet({ value: cachedAdapterResponse.result })
        const response: AdapterResponse = {
          jobRunID: adapterRequest.id,
          ...cachedAdapterResponse,
          debug,
        }

        return response
      }
    }

    return undefined
  }
}

export const withCache =
  (rateLimit?: Store<reducer.BurstLimitState>): Middleware =>
  async (execute, context: AdapterContext) => {
    // If disabled noop
    if (!context?.cache?.instance) return (data: AdapterRequest) => execute(data, context)

    const adapterCache = new AdapterCache(context)

    const {
      cache: options,
      cache: { instance: cache },
    } = context

    return async (adapterRequest) => {
      const key = adapterCache.getKey(adapterRequest)
      const coalescingKey = adapterCache.getCoalescingKey(key)
      const observe = metrics.beginObserveCacheMetrics({
        isFromWs: !!adapterRequest.debug?.ws,
        participantId: key,
        feedId: adapterRequest.metricsMeta?.feedId || 'N/A',
      })

      try {
        const cachedAdapterResponse = await adapterCache.getResultForRequest(adapterRequest)
        if (cachedAdapterResponse) return cachedAdapterResponse
      } catch (error) {
        logger.warn(`Cache middleware error! Passing through. `, error)
        return await execute(adapterRequest, context)
      }

      const maxAge = getTTL(adapterRequest, options)

      try {
        // Initiate request coalescing by adding the in-flight mark
        await adapterCache.setInFlightMarker(coalescingKey, maxAge)
      } catch (error) {
        logger.warn(`Cache middleware error! Passing through. `, error)
        return await execute(adapterRequest, context)
      }

      const burstRateLimit = withBurstLimit(rateLimit)
      const executeWithBackoff = await burstRateLimit(execute, context)
      const result = await executeWithBackoff(adapterRequest, context)

      try {
        // Add successful result to cache
        const _cacheOnSuccess = async ({
          statusCode,
          data,
          result,
          debug,
        }: Pick<AdapterResponse, 'statusCode' | 'data' | 'result' | 'debug'>) => {
          if (statusCode === 200) {
            const debugBatchablePropertyPath = debug
              ? { batchablePropertyPath: debug.batchablePropertyPath }
              : {}
            const entry: CacheEntry = {
              statusCode,
              data,
              result,
              maxAge,
              debug: debugBatchablePropertyPath,
            }
            // we should observe non-200 entries too
            await cache.setResponse(key, entry, maxAge)
            observe.cacheSet({ statusCode, maxAge })
            logger.trace(`Cache: SET ${key}`, entry)
            // Individually cache batch requests
            if (data?.results) {
              for (const batchParticipant of Object.values<[AdapterRequest, number]>(
                data.results,
              )) {
                const [request, result] = batchParticipant
                const keyBatchParticipant = adapterCache.getKey(request)
                const debugBatchablePropertyPath = debug
                  ? { batchablePropertyPath: debug.batchablePropertyPath }
                  : {}
                const entryBatchParticipant = {
                  statusCode,
                  data: { result },
                  result,
                  maxAge,
                  debug: debugBatchablePropertyPath,
                }
                await cache.setResponse(keyBatchParticipant, entryBatchParticipant, maxAge)
                logger.trace(`Cache Split Batch: SET ${keyBatchParticipant}`, entryBatchParticipant)
              }
            }
          }
          // Notify pending requests by removing the in-flight mark
          await adapterCache.delInFlightMarker(coalescingKey)
        }
        await _cacheOnSuccess(result)

        const debug = {
          staleness: 0,
          performance: observe.stalenessAndExecutionTime(false, 0),
          providerCost: result.data.cost || 1,
        }
        return { ...result, debug: { ...debug, ...result.debug } }
      } catch (error) {
        return result
      }
    }
  }
