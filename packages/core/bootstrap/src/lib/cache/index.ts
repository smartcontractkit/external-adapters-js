import hash from 'object-hash'
import { AdapterRequest, AdapterResponse, Middleware } from '@chainlink/types'
import { logger } from '../external-adapter'
import { parseBool, uuid, delay, exponentialBackOffMs, getWithCoalescing } from '../util'
import * as local from './local'
import * as redis from './redis'
import * as metrics from './metrics'

const DEFAULT_CACHE_TYPE = 'local'
const DEFAULT_CACHE_KEY_GROUP = uuid()
const DEFAULT_CACHE_KEY_IGNORED_PROPS = ['id', 'maxAge', 'meta', 'rateLimitMaxAge']
// Request coalescing
const DEFAULT_RC_INTERVAL = 100
const DEFAULT_RC_INTERVAL_MAX = 1000
const DEFAULT_RC_INTERVAL_COEFFICIENT = 2
const DEFAULT_RC_ENTROPY_MAX = 0

export const MAXIMUM_MAX_AGE = 1000 * 60 * 2
const ERROR_MAX_AGE = 1000 * 60

const env = process.env
export const defaultOptions = () => ({
  enabled: parseBool(env.CACHE_ENABLED),
  cacheOptions: defaultCacheOptions(),
  cacheBuilder: defaultCacheBuilder(),
  key: {
    group: env.CACHE_KEY_GROUP || DEFAULT_CACHE_KEY_GROUP,
    ignored: [
      ...DEFAULT_CACHE_KEY_IGNORED_PROPS,
      ...(env.CACHE_KEY_IGNORED_PROPS || '').split(',').filter((k) => k), // no empty keys
    ],
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
})
export type CacheOptions = ReturnType<typeof defaultOptions>

const defaultCacheOptions = () => {
  const type = env.CACHE_TYPE || DEFAULT_CACHE_TYPE
  const options = type === 'redis' ? redis.defaultOptions() : local.defaultOptions()
  return { ...options, type }
}
export type CacheImplOptions = ReturnType<typeof defaultCacheOptions>

// TODO: Revisit this after we stop to reinitialize middleware on every request
// We store the local LRU cache instance, so it's not reinitialized on every request
let localLRUCache: local.LocalLRUCache
const defaultCacheBuilder = () => {
  return (options: CacheImplOptions) => {
    switch (options.type) {
      case 'redis':
        return redis.RedisCache.build(options as redis.RedisOptions)
      default:
        return localLRUCache || (localLRUCache = new local.LocalLRUCache(options))
    }
  }
}
// Options without sensitive data
export const redactOptions = (options: CacheOptions): CacheOptions => ({
  ...options,
  cacheOptions:
    options.cacheOptions.type === 'redis'
      ? redis.redactOptions(options.cacheOptions as redis.RedisOptions)
      : local.redactOptions(options.cacheOptions),
})

export const withCache: Middleware = async (execute, options = defaultOptions()) => {
  // If disabled noop
  if (!options.enabled) return (data: AdapterRequest) => execute(data)

  const cache = await options.cacheBuilder(options.cacheOptions)

  // Algorithm we use to derive entry key
  const hashOptions = {
    algorithm: 'sha1',
    encoding: 'hex',
    excludeKeys: (props: string) => options.key.ignored.includes(props),
  }

  const _getKey = (data: AdapterRequest) => `${options.key.group}:${hash(data, hashOptions)}`
  const _getCoalescingKey = (key: string) => `inFlight:${key}`
  const _setInFlightMarker = async (key: string, maxAge: number) => {
    if (!options.requestCoalescing.enabled) return
    await cache.set(key, true, maxAge)
    logger.debug(`Request coalescing: SET ${key}`)
  }
  const _delInFlightMarker = async (key: string) => {
    if (!options.requestCoalescing.enabled) return
    await cache.del(key)
    logger.debug(`Request coalescing: DEL ${key}`)
  }

  const _getRateLimitMaxAge = (data: AdapterRequest): number | undefined => {
    if (!data || !data.data) return
    if (isNaN(data.data.rateLimitMaxAge as number)) return
    const maxAge = Number(data.data.rateLimitMaxAge)
    if (maxAge && maxAge > ERROR_MAX_AGE) {
      logger.error(`Cache: Max Age is getting max values: ${maxAge} ms`)
      return maxAge > MAXIMUM_MAX_AGE ? MAXIMUM_MAX_AGE : maxAge
    }
    if (maxAge && maxAge > options.cacheOptions.maxAge) {
      logger.warn(`Cache: Max Age is getting high values: ${maxAge} ms`)
    }
    return maxAge
  }

  const _getDefaultMaxAge = (data: AdapterRequest): any => {
    const rlMaxAge = _getRateLimitMaxAge(data)
    return rlMaxAge || cache.options.maxAge
  }

  const _getRequestMaxAge = (data: AdapterRequest): number | undefined => {
    if (!data || !data.data) return
    if (isNaN(data.data.maxAge as number)) return
    return Number(data.data.maxAge)
  }

  const _executeWithCache = async (data: AdapterRequest) => {
    const key = _getKey(data)
    const coalescingKey = _getCoalescingKey(key)
    const endMetrics = metrics.observeMetrics(data.id, key)
    const maxAge = _getRequestMaxAge(data) || _getDefaultMaxAge(data)
    // Add successful result to cache
    const _cacheOnSuccess = async ({ statusCode, data, result }: AdapterResponse) => {
      if (statusCode === 200) {
        const entry = { statusCode, data, result, maxAge }
        await cache.set(key, entry, maxAge)
        logger.debug(`Cache: SET ${key}`, entry)
        // Notify pending requests by removing the in-flight mark
        await _delInFlightMarker(coalescingKey)
      }
    }

    const _getWithCoalescing = () =>
      getWithCoalescing({
        get: async (retryCount: number) => {
          const entry = await cache.get(key)
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
          const inFlight = await cache.get(coalescingKey)
          logger.debug(`Request coalescing: CHECK inFlight:${!!inFlight} on retry #${retryCount}`)
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

    const entry = options.requestCoalescing.enabled
      ? await _getWithCoalescing()
      : await cache.get(key)

    if (entry) {
      if (maxAge >= 0) {
        logger.debug(`Cache: GET ${key}`, entry)
        const reqMaxAge = _getRequestMaxAge(data)
        if (reqMaxAge && reqMaxAge !== entry.maxAge) await _cacheOnSuccess(entry)
        const ttl = await cache.pttl(key)
        const staleness = entry.maxAge - ttl
        const debug = {
          cacheHit: true,
          staleness,
          performance: endMetrics(true, staleness),
          providerCost: 0,
        }
        return {
          jobRunID: data.id,
          ...entry,
          debug,
        }
      }
      logger.debug(`Cache: SKIP(maxAge < 0)`)
    }

    // Initiate request coalescing by adding the in-flight mark
    await _setInFlightMarker(coalescingKey, maxAge)

    const result = await execute(data)
    await _cacheOnSuccess(result)
    const debug = {
      staleness: 0,
      performance: endMetrics(false, 0),
      providerCost: result.data.cost || 1,
    }
    return { ...result, debug }
  }

  // Middleware wrapped execute fn which cleans up after
  return async (input) => {
    const result = await _executeWithCache(input)
    // Clean the connection
    await cache.close()
    return result
  }
}
