import {
  AdapterContext,
  AdapterRequest,
  AdapterResponse,
  Middleware,
  APIEndpoint,
} from '@chainlink/types'
import hash from 'object-hash'
import { logger, normalizeInput } from '../external-adapter'
import {
  delay,
  exponentialBackOffMs,
  getHashOpts,
  getWithCoalescing,
  parseBool,
  uuid,
} from '../util'
import { getMaxAgeOverride, getTTL } from './ttl'
import * as local from './local'
import { LocalOptions } from './local'
import * as metrics from './metrics'
import * as redis from './redis'
import { CacheEntry } from './types'

const env = process.env
export const CACHE_ENABLED = parseBool(env.CACHE_ENABLED)

const DEFAULT_CACHE_TYPE = 'local'
const DEFAULT_CACHE_KEY_GROUP = uuid()
// Request coalescing
const DEFAULT_RC_INTERVAL = 100
const DEFAULT_RC_INTERVAL_MAX = 1000
const DEFAULT_RC_INTERVAL_COEFFICIENT = 2
const DEFAULT_RC_ENTROPY_MAX = 0

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
  }
  minimumAge: number
}

export const defaultOptions = (): CacheOptions => ({
  enabled: CACHE_ENABLED,
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
  },
  minimumAge: Number(env.CACHE_MIN_AGE) || MINIMUM_AGE,
})

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

export const withCache: Middleware = async (
  execute,
  context: AdapterContext,
  endpointSelector?: (request: AdapterRequest) => APIEndpoint,
) => {
  const {
    cache: options,
    cache: { instance: cache },
  } = context
  // If disabled noop
  if (!cache) return (data: AdapterRequest) => execute(data, context)

  // Algorithm we use to derive entry key
  const hashOptions = getHashOpts()

  const _getKey = (data: AdapterRequest) => `${options.key.group}:${hash(data, hashOptions)}`
  const _getCoalescingKey = (key: string) => `inFlight:${key}`
  const _setInFlightMarker = async (key: string, maxAge: number) => {
    if (!options.requestCoalescing.enabled) return
    await cache.setFlightMarker(key, maxAge)
    logger.debug(`Request coalescing: SET ${key}`)
  }
  const _delInFlightMarker = async (key: string) => {
    if (!options.requestCoalescing.enabled) return
    await cache.del(key)
    logger.debug(`Request coalescing: DEL ${key}`)
  }

  const _executeWithCache = async (adapterRequest: AdapterRequest): Promise<AdapterResponse> => {
    const request = endpointSelector
      ? normalizeInput(adapterRequest, endpointSelector(adapterRequest))
      : adapterRequest
    const key = _getKey(request)
    const coalescingKey = _getCoalescingKey(key)
    const observe = metrics.beginObserveCacheMetrics({
      isFromWs: !!adapterRequest.debug?.ws,
      participantId: key,
      feedId: adapterRequest.metricsMeta?.feedId || 'N/A',
    })

    const _getWithCoalescing = () =>
      getWithCoalescing({
        get: async (retryCount: number) => {
          const entry = await cache.getResponse(key)
          if (entry) logger.debug(`Request coalescing: GET on retry #${retryCount}`)
          return entry
        },
        isInFlight: async (retryCount: number) => {
          if (retryCount === 1 && options.requestCoalescing.entropyMax) {
            // Add some entropy here because of possible scenario where the key won't be set before multiple
            // other instances in a burst request try to access the coalescing key.
            const randomMs = Math.random() * options.requestCoalescing.entropyMax
            await delay(randomMs)
          }
          const inFlight = await cache.getFlightMarker(coalescingKey)
          logger.debug(`Request coalescing: CHECK inFlight:${inFlight} on retry #${retryCount}`)
          return inFlight
        },
        retries: 5,
        interval: (retryCount: number) =>
          exponentialBackOffMs(
            retryCount,
            options.requestCoalescing.interval,
            options.requestCoalescing.intervalMax,
            options.requestCoalescing.intervalCoefficient,
          ),
      })

    const cachedAdapterResponse = options.requestCoalescing.enabled
      ? await _getWithCoalescing()
      : await cache.getResponse(key)

    if (cachedAdapterResponse) {
      const maxAgeOverride = getMaxAgeOverride(adapterRequest)
      if (maxAgeOverride && maxAgeOverride < 0) {
        logger.trace(`Cache: SKIP(maxAge < 0)`)
      } else {
        logger.trace(`Cache: GET ${key}`, cachedAdapterResponse)
        const ttl = await cache.ttl(key)
        // TODO: isnt this a bug? cachedAdapterResponse.maxAge will be different
        // if the above conditional gets executed!
        const staleness = (cachedAdapterResponse.maxAge - ttl) / 1000
        const debug = {
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

    const maxAge = getTTL(adapterRequest, options)

    // Initiate request coalescing by adding the in-flight mark
    await _setInFlightMarker(coalescingKey, maxAge)

    const result = await execute(adapterRequest, context)

    // Add successful result to cache
    const _cacheOnSuccess = async ({
      statusCode,
      data,
      result,
    }: Pick<AdapterResponse, 'statusCode' | 'data' | 'result'>) => {
      if (statusCode === 200) {
        const entry: CacheEntry = {
          statusCode,
          data,
          result,
          maxAge,
        }
        // we should observe non-200 entries too
        await cache.setResponse(key, entry, maxAge)
        observe.cacheSet({ statusCode, maxAge })
        logger.trace(`Cache: SET ${key}`, entry)
        // Individually cache batch requests
        if (data?.results) {
          for (const batchParticipant of Object.values<[AdapterRequest, number]>(data.results)) {
            const [request, result] = batchParticipant
            const maxAgeBatchParticipant = getTTL(request, options)
            const normalizedRequest = endpointSelector
              ? normalizeInput(request, endpointSelector(request))
              : request
            const keyBatchParticipant = _getKey(normalizedRequest)
            const entryBatchParticipant = {
              statusCode,
              data: { result },
              result,
              maxAge,
            }
            await cache.setResponse(
              keyBatchParticipant,
              entryBatchParticipant,
              maxAgeBatchParticipant,
            )
            logger.trace(`Cache Split Batch: SET ${keyBatchParticipant}`, entryBatchParticipant)
          }
        }
        // Notify pending requests by removing the in-flight mark
        await _delInFlightMarker(coalescingKey)
      }
    }
    await _cacheOnSuccess(result)

    const debug = {
      staleness: 0,
      performance: observe.stalenessAndExecutionTime(false, 0),
      providerCost: result.data.cost || 1,
    }
    return { ...result, debug: { ...debug, ...result.debug } }
  }

  // Middleware wrapped execute fn which cleans up after
  return async (input) => {
    return await _executeWithCache(input)
  }
}
