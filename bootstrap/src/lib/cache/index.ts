import { logger } from '@chainlink/external-adapter'
import hash from 'object-hash'
import * as local from './local'
import * as redis from './redis'
import { parseBool, uuid, delay, exponentialBackOffMs, getWithCoalescing } from '../util'
import { AdapterRequest, AdapterResponse } from '@chainlink/types'
import { RedisOptions } from './redis'
import { Middleware } from '../../index'

const DEFAULT_CACHE_TYPE = 'local'
const DEFAULT_CACHE_KEY_GROUP = uuid()
const DEFAULT_CACHE_KEY_IGNORED_PROPS = ['id', 'maxAge', 'meta']
// Rate Limiting
const DEFAULT_CACHE_KEY_RATE_LIMIT_PARTICIPANT = uuid()
const DEFAULT_GROUP_MAX_AGE = 1000 * 60 * 60 * 2
const DEFAULT_RATE_WEIGHT = 1
const DEFAULT_RATE_COST = 1
// Request coalescing
const DEFAULT_RC_INTERVAL = 100
const DEFAULT_RC_INTERVAL_MAX = 1000
const DEFAULT_RC_INTERVAL_COEFFICIENT = 2
const DEFAULT_RC_ENTROPY_MAX = 0

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
  rateLimit: {
    groupMaxAge: parseInt(env.GROUP_MAX_AGE || '') || DEFAULT_GROUP_MAX_AGE,
    groupId: (env.API_KEY && hash(env.API_KEY)) || undefined,
    participantId: DEFAULT_CACHE_KEY_RATE_LIMIT_PARTICIPANT,
    totalCapacity: parseInt(env.CACHE_RATE_CAPACITY || ''),
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
        return redis.RedisCache.build(options as RedisOptions)
      default:
        return localLRUCache || (localLRUCache = new local.LocalLRUCache(options))
    }
  }
}
// Options without sensitive data
export const redactOptions = (options: CacheOptions) => ({
  ...options,
  cacheOptions:
    options.cacheOptions.type === 'redis'
      ? redis.redactOptions(options.cacheOptions as RedisOptions)
      : local.redactOptions(options.cacheOptions),
})

export const withCache: Middleware<CacheOptions> = async (execute, options = defaultOptions()) => {
  // If disabled noop
  if (!options.enabled) return (data: AdapterRequest) => execute(data)

  const cache = await options.cacheBuilder(options.cacheOptions)
  const rateLimit = makeRateLimit(options.rateLimit, cache)
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

  const _getRequestMaxAge = (data: AdapterRequest): number | undefined => {
    if (!data || !data.data) return
    if (isNaN(data.data.maxAge as number)) return
    return Number(data.data.maxAge)
  }
  const _getDefaultMaxAge = async (): Promise<any> => {
    return rateLimit.isEnabled() ? await rateLimit.getParticipantMaxAge() : cache.options.maxAge
  }
  // MaxAge in the request will always have preference
  const _getMaxAge = async (request: AdapterRequest) => {
    return _getRequestMaxAge(request) || (await _getDefaultMaxAge())
  }

  const _executeWithCache = async (request: AdapterRequest) => {
    const key = _getKey(request)
    const coalescingKey = _getCoalescingKey(key)
    // Add successful result to cache
    const _cacheOnSuccess = async ({ statusCode, data }: AdapterResponse) => {
      if (statusCode === 200) {
        if (rateLimit.isEnabled()) {
          await rateLimit.updateRateLimitGroup(data.data.cost, data.data.weight)
        }
        let maxAge = await _getMaxAge(request)
        if (maxAge < 0) {
          maxAge = await _getDefaultMaxAge()
        }
        const entry = { statusCode, data, maxAge }
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

    const maxAge = await _getMaxAge(request)
    if (entry) {
      if (maxAge >= 0) {
        logger.debug(`Cache: GET ${key}`, entry)
        if (maxAge !== entry.maxAge) await _cacheOnSuccess(entry)
        return entry
      }
      logger.debug(`Cache: SKIP(maxAge < 0)`)
    }

    // Initiate request coalescing by adding the in-flight mark
    await _setInFlightMarker(coalescingKey, maxAge)

    const result = await execute(request)
    await _cacheOnSuccess(result)
    return result
  }

  // Middleware wrapped execute fn which cleans up after
  return async (input) => {
    const result = await _executeWithCache(input)
    // Clean the connection
    await cache.close()
    return result
  }
}
